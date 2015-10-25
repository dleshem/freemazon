package com.amazon;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Amazon's internal BookSearchResults structure.
 * @author DL
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class BookSearchResults extends Response {
    /** Default constructor (required for json deserialization) */
    public BookSearchResults() {}
    
    public Map<Integer, String> jumboImageUrls;
    public Map<Integer, String> largeImageUrls;
    public Integer totalResults;
    public List<List<String>> results;
    
    private static final long serialVersionUID = 1L;
}
