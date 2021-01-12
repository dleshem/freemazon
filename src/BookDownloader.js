import {AmazonSitbClient} from 'amazon-sitb';
import BookDownloadData from './BookDownloadData';
import {Html5Entities} from 'html-entities';
import request from 'request';
import _ from 'lodash';
import path from 'path';
import fs from 'fs';

const entities = new Html5Entities();

const checkFileExists = async (path) => {
	return new Promise((resolve, reject) => {
		fs.stat(path, (err, stats) => {
			resolve(!err);
		});
	});
};

const writeFile = async (path, data, encoding) => {
	return new Promise((resolve, reject) => {
		fs.writeFile(path, data, encoding, (err) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
};

const readFile = async (path, encoding) => {
	return new Promise((resolve, reject) => {
		fs.readFile(path, encoding, (err, data) => {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	});
};

const mkdir = async (path) => {
	return new Promise((resolve, reject) => {
		fs.mkdir(path, (err) => {
			if (!err || (err.code === 'EEXIST')) {
				resolve();
			} else {
				reject(err);
			}
		});
	});
};

const fetch = async (url) => {
	return new Promise((resolve, reject) => {
		request.get({uri: url, encoding: null}, (error, response, body) => {
			if (!error && (response.statusCode === 200)) {
				resolve({
					contentType: response.headers['content-type'],
					body
				});
			} else {
				reject(error || response.statusCode);
			}
		});
	});
};

const saveToFile = async ({url, pathNoExtension}) => {
	const {contentType, body} = await fetch(url);

	const extension = contentType ? contentType.substr(contentType.indexOf('/') + 1) : 'bin';
	await writeFile(`${pathNoExtension}.${extension}`, body, 'binary');
};

export default class BookDownloader {
	constructor({booksPath, asin, timeout = 0}) {
		this._bookPath = path.join(booksPath, asin);
		this._sitb = new AmazonSitbClient({timeout});
		this._asin = asin;
		this._bookDownloadDataPath = null;
		this._bookDownloadData = null;
	}
	
	async init() {
		const exists = await checkFileExists(this._getBookDownloadDataPath());
		
		if (!exists) {
			// First run
			const bookData = await this._sitb.getBookData({
				asin: this._asin
			});
			
			// TODO: use bookData.sampleSearches
			this._bookDownloadData = new BookDownloadData({
				bookTitle: bookData.title,
				numPages: bookData.numPages
			});
			
			// Use initial, given pages
			this._bookDownloadData.onPageImages(bookData.jumboImageUrls);
			
			// TODO: Use LITB images
			
			await this._serialize();
		} else {
			// Continuing from previous run
			this._bookDownloadData = new BookDownloadData({});
			await this._deserialize();
		}
	};
	
	printInfo() {
		console.log(this._bookDownloadData.toString());
	}
	
	async useQuery(query) {
		if (!this._bookDownloadData.usedQuery(query)) {
			const bookSearchResults = await this._sitb.getSearchResults({
				asin: this._asin,
				pageNumber: '1',
				pageSize: '10000',
				query
			});
			
			try {
				this._bookDownloadData.onQuery(query);
				this._bookDownloadData.onPageImages(bookSearchResults.jumboImageUrls);
				
				const suggestedQueries = [];
				_.each(bookSearchResults.results, ([page, pageTitle, sentence, token]) => {
					this._bookDownloadData.onPageTokens({
						[page]: token
					});
					
					sentence = entities.decode(sentence.replace(/<b>/g, '').replace(/<\/b>/g, ''));
					_(sentence.split(' ')).map((word) => {
						return word.toLowerCase().replace(/[^a-zA-Z0-9'&\\s\\-]/g, '');
					}).each((normalizedWord) => {
						if (normalizedWord.length !== 0 && normalizedWord !== query) {
							suggestedQueries.push(normalizedWord);
						}
					});
				});
				
				_.each(suggestedQueries, (suggestedQuery) => {
					this._bookDownloadData.onSuggestedQuery(suggestedQuery);
				});
				await this._serialize();
			} catch (e) {
                // Search query is weird? Not much to do.
				this._bookDownloadData.onQuery(query);
				await this._serialize()
			}
		}
	}

	async addSuggestedQueries(queries) {
		_.each(queries, query => {
			this._bookDownloadData.addSuggestedQuery(query);
		});

		await this._serialize();
	}
	
	async useSuggestedQueries(maxQueries) {
		const useQueryPromises = _(this._bookDownloadData.getSuggestedQueries())
			.slice(0, maxQueries)
			.map(query => this.useQuery(query))
			.value();
		
		await Promise.all(useQueryPromises);
	}
	
	async retrieveImageUrls({auth, maxQueries}) {
		const goToPagePromises = _(this._bookDownloadData.getPageTokens())
			.toPairs()
			.sampleSize(maxQueries)
			.fromPairs()
			.map((token, page) => {
				return this._sitb.goToPage({
					asin: this._asin,
					page,
					token,
					auth
				});
			})
			.value();
		
		const values = await Promise.all(goToPagePromises);
		_.each(values, (bookPages) => {
			this._bookDownloadData.onPageImages(bookPages.jumboImageUrls);
		});

		await this._serialize();
	};
	
	async saveImages(maxImages) {
		const pageImages = _(this._bookDownloadData.getPageImages())
			.toPairs()
			.sampleSize(maxImages)
			.fromPairs()
			.value();

		const saveToFilePromises = _.map(pageImages, (imageUrl, page) => {
			return saveToFile({
				url: imageUrl,
				pathNoExtension: path.join(this._getBookPagesPath(), page)
			});
		});
		
		await Promise.all(saveToFilePromises);
		
		_(pageImages).keys().each((page) => {
			this._bookDownloadData.onPageDownload(page);
		});

		await this._serialize();
	}
	
	_getBookDownloadDataPath() {
		return path.join(this._bookPath, 'book.json');
	}
	
	_getBookPagesPath() {
        return path.join(this._bookPath, this._bookDownloadData.getBookTitle().replace(/[^a-zA-Z0-9'&\\s\\-]/g, ''));
	}
	
	async _serialize() {
		await mkdir(this._bookPath);
		await mkdir(this._getBookPagesPath());

		await writeFile(this._getBookDownloadDataPath(), this._bookDownloadData.serialize(), 'utf8');
	};
	
	async _deserialize() {
		const str = await readFile(this._getBookDownloadDataPath(), 'utf8');
		return this._bookDownloadData.deserialize(str);
	}
}
