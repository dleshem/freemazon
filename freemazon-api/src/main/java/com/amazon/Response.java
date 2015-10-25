package com.amazon;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Base class for Amazon's SITB API responses, for error indication.
 * @author DL
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class Response implements Serializable {
    /** Default constructor (required for json deserialization) */
    public Response() {}

    public Error error;
    
    private static final long serialVersionUID = 1L;
}
