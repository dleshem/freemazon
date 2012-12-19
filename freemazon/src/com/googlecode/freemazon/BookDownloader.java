package com.googlecode.freemazon;

import com.amazon.BookData;
import com.amazon.BookPages;
import com.amazon.BookSearchResults;
import com.amazon.SitbClient;
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.HashSet;
import java.util.List;
import java.util.Map.Entry;
import java.util.Set;
import java.util.StringTokenizer;

/**
 * Downloads Amazon books, page by page.
 * @author DL
 */
public class BookDownloader {
    public BookDownloader(String authCookie, String asin) throws Exception {
        sitbClient = new SitbClient(authCookie);
        this.asin = asin;

        final File downloadDataFile = new File(bookDir() + downloadDataFilename);
        if (!downloadDataFile.exists()) {
            final BookData bookData = sitbClient.getBookData(asin);
            if (bookData.sampleSearches != null) {
                for (String searchTerm : bookData.sampleSearches) {
                    System.out.println(searchTerm);
                }
            }

            downloadData = new BookDownloadData(bookData.title, bookData.numPages);

            // Use initial, given pages
            downloadData.onPageImages(bookData.jumboImageUrls);

            // Use LITB pages
            while (!bookData.litbPages.isEmpty()) {
                final Integer page = bookData.litbPages.get(0);
                final BookPages pages = sitbClient.goToLitbPage(asin, page);

                bookData.litbPages.remove(page);
                if (pages.jumboImageUrls != null) {
                    downloadData.onPageImages(pages.jumboImageUrls);
                    bookData.litbPages.removeAll(pages.jumboImageUrls.keySet());
                }
            }
            serialize();
        } else {
            final FileInputStream fis = new FileInputStream(downloadDataFile);
            final ObjectInputStream ois = new ObjectInputStream(fis);
            try {
                downloadData = (BookDownloadData) ois.readObject();
            } finally {
                ois.close();
            }
        }
    }

    private String booksDir() {
        return "books/";
    }

    private String bookDir() {
        return booksDir() + asin + "/";
    }

    private String pagesDir() {
        return bookDir() + downloadData.bookTitle().replaceAll("[^a-zA-Z0-9'&\\s\\-]", "") + "/";
    }

    private void serialize() throws IOException {
        final File pagesDir = new File(pagesDir());
        pagesDir.mkdirs();

        final FileOutputStream fos = new FileOutputStream(bookDir() + downloadDataFilename);
        final ObjectOutputStream oos = new ObjectOutputStream(fos);
        try {
            oos.writeObject(downloadData);
        } finally {
            oos.close();
        }
    }

    public void printInfo() {
        System.out.println(downloadData);
    }

    public Set<String> useQuery(String query) throws IOException {
        final Set<String> queries = new HashSet<String>();

        if (downloadData.usedQuery(query)) {
            return queries;
        }
        
        BookSearchResults searchResults = null;
        for (int i = 0; i < NUM_TRIES; ++i) {
            try {
                searchResults = sitbClient.getSearchResults(asin, query, 1, 10000);
                break;
            } catch (IOException e) {
                if (i == (NUM_TRIES - 1)) {
                    throw e;
                }
            }
        }

        downloadData.onQuery(query);

        if (searchResults.jumboImageUrls != null) {
            downloadData.onPageImages(searchResults.jumboImageUrls);
        }
        
        if ((searchResults.totalResults != null) && (searchResults.totalResults.intValue() > 0)) {
            for (List<String> result : searchResults.results) {
            	try {
	                final int page = Integer.parseInt(result.get(0));
	                final String token = result.get(3);
	
	                downloadData.onPageToken(page, token);
	
	                final StringTokenizer tokenizer = new StringTokenizer(result.get(2));
	                while (tokenizer.hasMoreTokens()) {
	                    String word = tokenizer.nextToken();
	                    word = word.replaceAll("[^a-zA-Z0-9'&\\s\\-]", "").toLowerCase();
	                    if ((!word.isEmpty()) && (!downloadData.usedQuery(word))) {
	                        queries.add(word);
	                    }
	                }
            	} catch (NumberFormatException e) {} // we sometimes get stuff like "s01j"...
            }
        }
        
        serialize();
        return queries;
    }

    public void retrieveImageUrls() throws Exception {
        for (Entry<Integer, String> entry : downloadData.pageTokens().entrySet()) {
            final Integer page = entry.getKey();
            final String token = entry.getValue();

            for (int i = 1; i <= NUM_TRIES; ++i) {
                try {
                    final BookPages pages = sitbClient.goToPage(asin, page, token);
                    if (pages.jumboImageUrls != null) {
                        downloadData.onPageImages(pages.jumboImageUrls);
                        serialize();
                    }
                    break;
                } catch (FileNotFoundException e) {
                    System.out.println("Error getting imageUrl for page " + page + " on try " + i + ".");
                }
            }
        }
    }

    private static final int NUM_TRIES = 3;

    public void saveImages() throws Exception {
        for (Entry<Integer, String> entry : downloadData.pageImages().entrySet()) {
            final Integer page = entry.getKey();
            final String imageUrl = entry.getValue();
            
            for (int i = 1; i <= NUM_TRIES; ++i) {
                try {
                    saveToFile(imageUrl, pagesDir() + page);
                    downloadData.onGotPage(page);
                    serialize();
                    break;
                } catch (FileNotFoundException e) {
                    System.out.println("Error getting page " + page + " on try " + i + ".");
                }
            }
        }
    }

    private static void saveToFile(String imageUrl, String filenameNoExt) throws Exception {
        URL url = null;
        try {
            url = new URL(imageUrl);
        } catch(MalformedURLException e) {
            url = new URL("http:" + imageUrl);
        }

        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.connect();

        String imageType = "bin";
        String headerName = null;
        for (int i = 1; (headerName = conn.getHeaderFieldKey(i)) != null; ++i) {
            if (headerName.equalsIgnoreCase("Content-Type")) {
                String contentType = conn.getHeaderField(i);
                imageType = contentType.substring(contentType.indexOf('/') + 1);
                break;
            }
        }

        final BufferedInputStream bis = new BufferedInputStream(conn.getInputStream());
        try {
            final FileOutputStream fos = new FileOutputStream(filenameNoExt + "." + imageType);
            final BufferedOutputStream bos = new BufferedOutputStream(fos);
            try {
                byte[] buffer = new byte[4096];
                int numRead;
                while ((numRead = bis.read(buffer)) != -1) {
                    bos.write(buffer, 0, numRead);
                }
            } finally {
                bos.close();
            }
        } finally {
            bis.close();
        }
    }

    private final SitbClient sitbClient;
    private final String asin;
    private final BookDownloadData downloadData;

    private static final String downloadDataFilename = "book.data";
}
