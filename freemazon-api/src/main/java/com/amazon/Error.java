package com.amazon;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Amazon's SITB API error information.
 * @author DL
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class Error implements Serializable {
    /** Default constructor (required for json deserialization) */
    public Error() {}
    
    public ErrorText text;
    public ErrorTitle title;
    public String reftag;

    private static final long serialVersionUID = 1L;
}
