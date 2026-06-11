package com.POA.AP6.dto;

import com.POA.AP6.model.Page;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PageSummaryResponse(
		UUID id,
		String title,
		String slug,
		List<String> keywords,
		Integer currentVersion,
		String authorName,
		LocalDateTime updatedAt
) {
	public static PageSummaryResponse from(Page page) {
		return new PageSummaryResponse(
				page.getId(),
				page.getTitle(),
				page.getSlug(),
				page.getKeywords().stream().toList(),
				page.getCurrentVersion(),
				page.getAuthor().getName(),
				page.getUpdatedAt());
	}
}
