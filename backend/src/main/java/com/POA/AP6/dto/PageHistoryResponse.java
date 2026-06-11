package com.POA.AP6.dto;

import com.POA.AP6.model.PageHistory;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PageHistoryResponse(
		UUID id,
		UUID pageId,
		Integer version,
		String title,
		String content,
		List<String> keywords,
		String editedByName,
		String changeSummary,
		LocalDateTime createdAt
) {
	public static PageHistoryResponse from(PageHistory history) {
		return new PageHistoryResponse(
				history.getId(),
				history.getPage().getId(),
				history.getVersion(),
				history.getTitle(),
				history.getContent(),
				history.getKeywords().stream().toList(),
				history.getEditedBy().getName(),
				history.getChangeSummary(),
				history.getCreatedAt());
	}
}
