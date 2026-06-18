package com.POA.AP6.dto;

import com.POA.AP6.model.Page;
import com.POA.AP6.util.MarkdownImageExtractor;
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
		LocalDateTime updatedAt,
		String coverImageUrl,
		String coverImageAlt
) {
	public static PageSummaryResponse from(Page page) {
		var coverImage = MarkdownImageExtractor.findFirst(page.getContent()).orElse(null);

		return new PageSummaryResponse(
				page.getId(),
				page.getTitle(),
				page.getSlug(),
				page.getKeywords().stream().toList(),
				page.getCurrentVersion(),
				page.getAuthor().getName(),
				page.getUpdatedAt(),
				coverImage == null ? null : coverImage.url(),
				coverImage == null ? null : coverImage.alt());
	}
}
