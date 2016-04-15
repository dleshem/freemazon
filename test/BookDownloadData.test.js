'use strict'

import BookDownloadData from '../src/BookDownloadData'
import {expect, assert} from 'chai'

describe('BookDownloadData', () => {
	const someTitle = 'some title'
	
	describe('getBookTitle', () => {
		it ('returns the book title', () => {
			const bdd = new BookDownloadData({bookTitle: someTitle, numPages: 123})
			expect(bdd.getBookTitle()).to.equal(someTitle)
		})
	})
	
	describe('usedQuery', () => {
		const someQuery = 'some query'
		it ('returns true if a query was used', () => {
			const bdd = new BookDownloadData({bookTitle: someTitle, numPages: 123})
			expect(bdd.usedQuery(someQuery)).to.be.false
		})
		
		it ('returns false if a query was not used', () => {
			const bdd = new BookDownloadData({bookTitle: someTitle, numPages: 123})
			bdd.onQuery(someQuery)
			expect(bdd.usedQuery(someQuery)).to.be.true
		})
	})
	
	describe('onPageTokens', () => {
		it ('adds the page tokens for unseen pages', () => {
			const someNewPageTokens = {
				'1': 'some token 1',
				'2': 'some token 2'
			}
			
			const bdd = new BookDownloadData({bookTitle: someTitle, numPages: 123})
			bdd.onPageTokens(someNewPageTokens)
			
			const pageTokens = bdd.getPageTokens()
			expect(pageTokens['1']).to.equal(someNewPageTokens['1'])
			expect(pageTokens['2']).to.equal(someNewPageTokens['2'])
		})
	})
	
	describe('onPageImages', () => {
		it ('adds the page image url for undownloaded pages', () => {
			const someNewPageImages = {
				'1': 'http://www.example.org/1.png',
				'2': 'http://www.example.org/2.png'
			}
			
			const bdd = new BookDownloadData({bookTitle: someTitle, numPages: 123})
			bdd.onPageImages(someNewPageImages)
			
			const pageImages = bdd.getPageImages()
			expect(pageImages['1']).to.equal(someNewPageImages['1'])
			expect(pageImages['2']).to.equal(someNewPageImages['2'])
		})
	})
})
