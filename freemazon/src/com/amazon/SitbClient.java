package com.amazon;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Amazon's SITB (search-inside-the-book) API client.
 * @author DL
 */
public class SitbClient {
    /**
     * Constructs the object.
     * @param authCookie   The "x-main" cookie value for amazon.com's domain.
     */
    public SitbClient(String authCookie) {
        this.authCookie = authCookie;
    }

    public BookData getBookData(String asin) throws Exception {
        final URL url = new URL(AMAZON_SITB_URL +
                "?method=getBookData" +
                "&asin=" + asin);

        return readJsonObject(url, new TypeReference<BookData>() {}, null);
    }
    
    public BookPages goToLitbPage(String asin, int page) throws IOException {
        final URL url = new URL(AMAZON_SITB_URL +
                "?method=goToLitbPage" +
                "&asin=" + asin +
                "&page=" + page);

        return readJsonObject(url, new TypeReference<BookPages>() {}, null);
    }

    public BookSearchResults getSearchResults(String asin, String query, int firstResult, int maxResults) throws IOException {
        final URL url = new URL(AMAZON_SITB_URL +
                "?method=getSearchResults" +
                "&asin=" + asin +
                "&pageNumber=" + firstResult +
                "&pageSize=" + maxResults +
                "&query=" + URLEncoder.encode(query, "UTF-8"));

        return readJsonObject(url, new TypeReference<BookSearchResults>() {}, null);
    }

    public BookPages goToSitbPage(String asin, int page, String token) throws IOException {
        final URL url = new URL(AMAZON_SITB_URL +
                "?method=goToSitbPage" +
                "&asin=" + asin +
                "&page=" + page +
                "&token=" + URLEncoder.encode(token, "UTF-8"));

        return readJsonObject(url, new TypeReference<BookPages>() {}, authCookie);
    }
    
    public BookPages goToPage(String asin, int page, String token) throws IOException {
        final URL url = new URL(AMAZON_SITB_URL +
                "?method=goToPage" +
                "&asin=" + asin +
                "&page=" + page +
                "&token=" + URLEncoder.encode(token, "UTF-8"));

        return readJsonObject(url, new TypeReference<BookPages>() {}, authCookie);
    }
    
    private static <T> T readJsonObject (URL url, TypeReference<T> typeReference, String authCookie) throws IOException {
        final HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestProperty("User-Agent", userAgent);
        if (authCookie != null) {
            conn.setRequestProperty("Cookie", "x-main=" + authCookie);
        }
        conn.connect();
        
        final Reader reader = new InputStreamReader(conn.getInputStream(), "UTF-8");
        try {
            return mapper.readValue(reader, typeReference);
        } finally {
            consumeReader(reader);
            reader.close();
        }

        // Avoid conn.disconnect() so the underlying socket can be reused
    }
    
    private static void consumeReader(Reader reader) {
        final char[] buffer = new char[4096];
        try {
            while (reader.read(buffer) != -1) {}
        } catch (IOException e) {}
    }

    private final String authCookie;
    
    private static final ObjectMapper mapper = new ObjectMapper();
    
    private static final String AMAZON_SITB_URL = "http://www.amazon.com/gp/search-inside/service-data";
    
    private static final String userAgent =
            "Mozilla/5.0 (Windows; U; Windows NT 6.0; pl; rv:1.9.1.2) Gecko/20090729 Firefox/3.5.2";
}
