'use strict'

import {AmazonSitbClient} from 'amazon-sitb'
import BookDownloadData from './BookDownloadData'
import {Html5Entities} from 'html-entities'
import request from 'request'
import _ from 'lodash'
import path from 'path'
import fs from 'fs'

const entities = new Html5Entities()

const checkFileExists = (path) => {
	return new Promise((resolve, reject) => {
		fs.stat(path, (err, stats) => {
			resolve(!err)
		})
	})
}

const writeFile = (path, data, encoding) => {
	return new Promise((resolve, reject) => {
		fs.writeFile(path, data, encoding, (err) => {
			if (err) {
				reject(err)
			} else {
				resolve()
			}
		})
	})
}

const readFile = (path, encoding) => {
	return new Promise((resolve, reject) => {
		fs.readFile(path, encoding, (err, data) => {
			if (err) {
				reject(err)
			} else {
				resolve(data)
			}
		})
	})
}

const mkdir = (path) => {
	return new Promise((resolve, reject) => {
		fs.mkdir(path, (err) => {
			if (!err || (err.code === 'EEXIST')) {
				resolve()
			} else {
				reject(err)
			}
		})
	})
}

const fetch = (url) => {
	return new Promise((resolve, reject) => {
		request.get({uri: url, encoding: null}, (error, response, body) => {
			if (!error && (response.statusCode === 200)) {
				resolve({
					contentType: response.headers['content-type'],
					body
				})
			} else {
				reject(error || response.statusCode)
			}
		})
	})
}

const saveToFile = ({url, pathNoExtension}) => {
	return fetch(url).then(({contentType, body}) => {
		const extension = contentType ? contentType.substr(contentType.indexOf('/') + 1) : 'bin'
		return writeFile(`${pathNoExtension}.${extension}`, body, 'binary')
	})
}

export default class BookDownloader {
	constructor({booksPath, asin}) {
		this._bookPath = path.join(booksPath, asin)
		this._sitb = new AmazonSitbClient({})
		this._asin = asin
		this._bookDownloadDataPath = null
		this._bookDownloadData = null
	}
	
	init() {
		return checkFileExists(this._getBookDownloadDataPath()).then((exists) => {
			if (!exists) {
				// First run
				return this._sitb.getBookData({
					asin: this._asin
				}).then((bookData) => {
					// TODO: use bookData.sampleSearches
					this._bookDownloadData = new BookDownloadData({bookTitle: bookData.title, numPages: bookData.numPages})
					
					// Use initial, given pages
					this._bookDownloadData.onPageImages(bookData.jumboImageUrls)
					
					// TODO: Use LITB images
					
					return this._serialize()
				})
			} else {
				// Continuing from previous run
				this._bookDownloadData = new BookDownloadData({})
				return this._deserialize()
			}
		})
	}
	
	printInfo() {
		console.log(this._bookDownloadData.toString())
	}
	
	useQuery(query) {
		if (this._bookDownloadData.usedQuery(query)) {
			return Promise.resolve()
		} else {
			const suggestedQueries = []
			return this._sitb.getSearchResults({
				asin: this._asin,
				pageNumber: '1',
				pageSize: '10000',
				query
			}).then((bookSearchResults) => {
				this._bookDownloadData.onQuery(query)
				this._bookDownloadData.onPageImages(bookSearchResults.jumboImageUrls)
				
				_.each(bookSearchResults.results, ([page, pageTitle, sentence, token]) => {
					this._bookDownloadData.onPageTokens({
						[page]: token
					})
					
					sentence = entities.decode(sentence.replace(/<b>/g, '').replace(/<\/b>/g, ''))
					_(sentence.split(' ')).map((word) => {
						return word.toLowerCase().replace(/[^a-zA-Z0-9'&\\s\\-]/g, '')
					}).each((normalizedWord) => {
						if (normalizedWord.length !== 0 && normalizedWord !== query) {
							suggestedQueries.push(normalizedWord)
						}
					})
				})
				
				_.each(suggestedQueries, (suggestedQuery) => {
					this._bookDownloadData.onSuggestedQuery(suggestedQuery)
				})
				return this._serialize()
			}, e => {
                // Search query is weird? Not much to do.
				this._bookDownloadData.onQuery(query)
				return this._serialize()
            })
		}
	}
	
	useSuggestedQueries(maxQueries) {
		const suggestedQueries = _(this._bookDownloadData.getSuggestedQueries()).slice(0, maxQueries).value()
		
		const useQueryPromises = _.map(suggestedQueries, (query) => {
			return this.useQuery(query)
		})
		
		return Promise.all(useQueryPromises)
	}
	
	retrieveImageUrls({auth}) {
		const goToPagePromises = _.map(this._bookDownloadData.getPageTokens(), (token, page) => {
			return this._sitb.goToPage({
				asin: this._asin,
				page,
				token,
				auth
			})
		})
		
		return Promise.all(goToPagePromises).then((values) => {
			_.each(values, (bookPages) => {
				this._bookDownloadData.onPageImages(bookPages.jumboImageUrls)
			})
		}).then(() => {
			return this._serialize()
		})
	}
	
	saveImages() {
		const pageImages = this._bookDownloadData.getPageImages()
		const saveToFilePromises = _.map(pageImages, (imageUrl, page) => {
			return saveToFile({
				url: imageUrl,
				pathNoExtension: path.join(this._getBookPagesPath(), page)
			})
		})
		
		return Promise.all(saveToFilePromises).then(() => {
			_(pageImages).keys().each((page) => {
				this._bookDownloadData.onPageDownload(page)
			})
		}).then(() => {
			return this._serialize()
		})
	}
	
	_getBookDownloadDataPath() {
		return path.join(this._bookPath, 'book.json')
	}
	
	_getBookPagesPath() {
        return path.join(this._bookPath, this._bookDownloadData.getBookTitle().replace(/[^a-zA-Z0-9'&\\s\\-]/g, ''));
	}
	
	_serialize() {
		return mkdir(this._bookPath).then(() => {
			return mkdir(this._getBookPagesPath())
		}).then(() => {
			return writeFile(this._getBookDownloadDataPath(), this._bookDownloadData.serialize(), 'utf8')
		})
	}
	
	_deserialize() {
		return readFile(this._getBookDownloadDataPath(), 'utf8').then((str) => {
			this._bookDownloadData.deserialize(str)
		})
	}
}
