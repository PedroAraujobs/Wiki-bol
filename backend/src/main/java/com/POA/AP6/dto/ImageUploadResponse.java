package com.POA.AP6.dto;

public record ImageUploadResponse(
		String url,
		String markdown,
		String path,
		String contentType,
		long size
) {
}
