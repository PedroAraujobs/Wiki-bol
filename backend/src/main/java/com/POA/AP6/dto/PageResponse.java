package com.POA.AP6.dto;

import com.POA.AP6.model.Page;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PageResponse(
		UUID id,
		String title,
		String slug,
		String content,
		List<String> keywords,
		Integer currentVersion,
		UserResponse author,
		LocalDateTime createdAt,
		LocalDateTime updatedAt
) {
	public static PageResponse from(Page page) {
		return new PageResponse(
				page.getId(),
				page.getTitle(),
				page.getSlug(),
				page.getContent(),
				page.getKeywords().stream().toList(),
				page.getCurrentVersion(),
				UserResponse.from(page.getAuthor()),
				page.getCreatedAt(),
				page.getUpdatedAt());
	}
}
