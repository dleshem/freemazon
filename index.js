'use strict'

import fs from 'fs'
import _ from 'lodash'
import BookDownloader from './src/BookDownloader'


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

readFile('settings.json', 'utf8').then((str) => {
	const {asin, queries, booksPath, auths} = JSON.parse(str)

	const auth = _.sample(auths)

	console.log(`== booksPath: ${booksPath} ==`);
	console.log(`== asin: ${asin} ==`);
	console.log(`== auth: ${JSON.stringify(auth)} ==`);

	const downloader = new BookDownloader({booksPath, asin})
	downloader.init().then((value) => {
		downloader.printInfo()
		return downloader.useQuery(queries[0])
	}).then(() => {
		downloader.printInfo()
		return downloader.useSuggestedQueries(50)
	}).then(() => {
		downloader.printInfo()
		return downloader.retrieveImageUrls({auth})
	}).then(() => {
		downloader.printInfo()
		return downloader.saveImages()
	}).then(() => {
		downloader.printInfo()
	}).catch((e) => {
		console.log('error: ', e)
	})
})
