'use strict'

import _ from 'lodash'

export default class BookDownloadData {
	constructor({bookTitle = '', numPages = 0}) {
		this._bookTitle = bookTitle
		
		this._usedQueries = {}
		this._suggestedQueries = {}
		
		this._unseenPages = {}
		for (let i = 1; i < numPages; ++i) {
			this._unseenPages[i] = true
		}
		
		this._pageTokens = {}
		this._pageImages = {}
		this._gotPages = {}
	}
	
	serialize() {
		return JSON.stringify({
			bookTitle: this._bookTitle,
			usedQueries: _.keys(this._usedQueries),
			suggestedQueries: _.keys(this._suggestedQueries),
			unseenPages: _.keys(this._unseenPages),
			pageTokens: this._pageTokens,
			pageImages: this._pageImages,
			gotPages: _.keys(this._gotPages)
		})
	}
	
	deserialize(str) {
		const data = JSON.parse(str)
		
		this._bookTitle = data.bookTitle
		
		this._usedQueries = {}
		_.each(data.usedQueries, (usedQuery) => {
			this._usedQueries[usedQuery] = true
		})
		this._suggestedQueries = {}
		_.each(data.suggestedQueries , (suggestedQuery) => {
			this._suggestedQueries[suggestedQuery] = true
		})
		
		this._unseenPages = {}
		_.each(data.unseenPages, (unseenPage) => {
			this._unseenPages[unseenPage] = true
		})
		
		this._pageTokens = data.pageTokens
		this._pageImages = data.pageImages
		this._gotPages = {}
		_.each(data.gotPages, (gotPage) => {
			this._gotPages[gotPage] = true
		})
	}
	
	getBookTitle() {
		return this._bookTitle
	}
	
	usedQuery(query = '') {
		return !!this._usedQueries[query]
	}
	
	onQuery(query = '') {
		delete this._suggestedQueries[query]
		this._usedQueries[query] = true
	}
	
	onSuggestedQuery(query = '') {
		if (!this._usedQueries[query] && !this._suggestedQueries[query]) {
			this._suggestedQueries[query] = true
		}
	}
	
	onPageTokens(pageTokens = {}) {
		_.each(pageTokens, (token, page) => {
			if (!this._gotPages[page] && !this._pageImages[page]) {
				delete this._unseenPages[page]
				this._pageTokens[page] = token
			}
		})
	}
	
	onPageImages(pageImages) {
		_.each(pageImages, (imageUrl, page) => {
			if (!this._gotPages[page]) {
				delete this._unseenPages[page]
				delete this._pageTokens[page]
				this._pageImages[page] = imageUrl
			}
		})
	}
	
	onPageDownload(page) {
		if (!this._gotPages[page]) {
			delete this._unseenPages[page]
			delete this._pageTokens[page]
			delete this._pageImages[page]
			this._gotPages[page] = true
		}
	}
	
	getSuggestedQueries() {
		return _.keys(this._suggestedQueries)
	}
	
	getPageTokens() {
		return _.clone(this._pageTokens)
	}
	
	getPageImages() {
		return _.clone(this._pageImages)
	}
	
	toString() {
		return `unseen: ${_.size(this._unseenPages)}, tokens: ${_.size(this._pageTokens)}, img urls: ${_.size(this._pageImages)}, got: ${_.size(this._gotPages)}`
	}
}
