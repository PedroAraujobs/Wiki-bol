package com.POA.AP6.dto;

import com.POA.AP6.model.AuthProvider;
import com.POA.AP6.model.User;
import java.time.LocalDateTime;
import java.util.UUID;

public record UserResponse(
		UUID id,
		String name,
		String email,
		AuthProvider provider,
		String avatarUrl,
		LocalDateTime createdAt
) {
	public static UserResponse from(User user) {
		return new UserResponse(
				user.getId(),
				user.getName(),
				user.getEmail(),
				user.getProvider(),
				user.getAvatarUrl(),
				user.getCreatedAt());
	}
}
