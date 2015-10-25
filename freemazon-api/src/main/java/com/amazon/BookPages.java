package com.amazon;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Amazon's internal BookPages structure.
 * @author DL
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class BookPages extends Response {
    /** Default constructor (required for json deserialization) */
    public BookPages() {}
    
    public Map<Integer, String> jumboImageUrls;
    public Map<Integer, String> largeImageUrls;
    
    private static final long serialVersionUID = 1L;
}
