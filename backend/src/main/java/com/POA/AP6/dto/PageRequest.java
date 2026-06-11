package com.POA.AP6.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record PageRequest(
		@NotBlank
		@Size(max = 255)
		String title,

		@NotBlank
		String content,

		@Size(max = 20)
		List<@Size(max = 50) String> keywords,

		@Size(max = 255)
		String changeSummary
) {
}
