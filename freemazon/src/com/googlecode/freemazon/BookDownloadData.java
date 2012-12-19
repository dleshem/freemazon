package com.googlecode.freemazon;

import java.io.Serializable;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

/**
 * Persistent data regarding a single book download process.
 * @author DL
 */
public class BookDownloadData implements Serializable {
    public BookDownloadData(String bookTitle, int numPages) {
        this.bookTitle = bookTitle;
        for (int i = 1; i <= numPages; ++i) {
            unseenPages.add(i);
        }
    }

    public String bookTitle() {
        return bookTitle;
    }

    public boolean usedQuery(String query) {
        return usedQueries.contains(query);
    }

    public void onQuery(String query) {
        usedQueries.add(query);
    }

    public void onPageTokens(Map<Integer, String> newPageTokens) {
        for (Entry<Integer, String> entry : newPageTokens.entrySet()) {
            onPageToken(entry.getKey(), entry.getValue());
        }
    }

    public void onPageToken(Integer page, String token) {
        if ((!gotPages.contains(page)) && (!pageImages.containsKey(page))) {
            unseenPages.remove(page);
            pageTokens.put(page, token);
        }
    }

    public void onPageImages(Map<Integer, String> newPageImages) {
        for (Entry<Integer, String> entry : newPageImages.entrySet()) {
            final Integer page = entry.getKey();
            if (!gotPages.contains(page)) {
                unseenPages.remove(page);
                pageTokens.remove(page);
                pageImages.put(page, entry.getValue());
            }
        }
    }

    public void onGotPage(Integer page) {
        if (!gotPages.contains(page)) {
            unseenPages.remove(page);
            pageTokens.remove(page);
            pageImages.remove(page);
            gotPages.add(page);
        }
    }

    public Map<Integer, String> pageTokens() {
        return new HashMap<Integer, String>(pageTokens);
    }

    public Map<Integer, String> pageImages() {
        return new HashMap<Integer, String>(pageImages);
    }

    @Override
    public String toString() {
        return "unseen: " + unseenPages.size() +
                ", tokens: " + pageTokens.size() +
                ", img urls: " + pageImages.size() +
                ", got: " + gotPages.size();
    }
    
    /** Pages with unknown image url or token. */
    private Set<Integer> unseenPages = new HashSet<Integer>();

    /** Pages with known tokens. */
    private Map<Integer, String> pageTokens = new HashMap<Integer, String>();

    /** Pages with known image url. */
    private Map<Integer, String> pageImages = new HashMap<Integer, String>();

    /** Downloaded pages. */
    private Set<Integer> gotPages = new HashSet<Integer>();

    /** Search queries used. */
    private Set<String> usedQueries = new HashSet<String>();

    /** Book name. */
    private String bookTitle = "book";
    
    private static final long serialVersionUID = 1L;
}
