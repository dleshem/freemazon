package com.amazon;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * @see Error
 * @author DL
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class ErrorText implements Serializable {
    /** Default constructor (required for json deserialization) */
    public ErrorText() {}
    
    public String LOGIN_RETURN_ARGS;
    public String key;
    
    private static final long serialVersionUID = 1L;
}
