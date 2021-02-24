import fs from 'fs';
import _ from 'lodash';
import {program} from 'commander';
import BookDownloader from './BookDownloader';


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

program
  .requiredOption('-a, --asin <asin>', 'Amazon Standard Identification Number (ASIN) to download');
  
program.parse(process.argv);

const { asin } = program;

(async () => {
	for (let i = 0; i < 100; ++i) {
		try {
			const str = await readFile('settings.json', 'utf8');

			const {queries, booksPath, auths} = JSON.parse(str);

			const auth = _.sample(auths);

			console.log(`== booksPath: ${booksPath} ==`);
			console.log(`== asin: ${asin} ==`);
			console.log(`== auth: ${JSON.stringify(auth)} ==`);

			const downloader = new BookDownloader({booksPath, asin, timeout: 5000});

			const value = await downloader.init();
			downloader.printInfo();

			await downloader.addSuggestedQueries(queries);
			await downloader.useSuggestedQueries(10);
			downloader.printInfo();

			await downloader.retrieveImageUrls({
				auth,
				maxQueries: 10
			});
			downloader.printInfo();

			await downloader.saveImages(5);
			downloader.printInfo();
		} catch (e) {
			console.log('error: ', e);
		}
	}
})();
