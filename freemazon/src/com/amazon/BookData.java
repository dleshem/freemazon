package com.amazon;

import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Amazon's internal BookData structure.
 * @author DL
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class BookData extends Response {
    /** Default constructor (required for json deserialization) */
    public BookData() {}
    
    public String thumbnailImage;
    public String buyingAsin;
    public Map<Integer, String> largeImageUrls;
    public String orientation;
    public String binding;
    public List<String> authorNameList;
    public Double usedAndNewLowestPrice;
    public String sessionId;
    public String ASIN;
    public String reviewStarsImageTag;
    public Boolean oneClick;
    public List<String> sampleSearches;
    public Boolean fullContent;
    public Map<Integer, String> t1Tokens;
    public Integer numPages;
    public List<Integer> litbPages;
    public Boolean searchable;
    public Double buyingPrice;
    public Map<Integer, String> jumboImageUrls;
    public String title;
    public Integer usedAndNewCount;
    
    private static final long serialVersionUID = 1L;
}
