package com.POA.AP6.exception;

import java.time.LocalDateTime;
import java.util.List;

public record ApiError(
		LocalDateTime timestamp,
		int status,
		String error,
		List<String> messages
) {
	public static ApiError of(int status, String error, List<String> messages) {
		return new ApiError(LocalDateTime.now(), status, error, messages);
	}
}
