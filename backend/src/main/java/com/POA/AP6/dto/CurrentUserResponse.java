package com.POA.AP6.dto;

import com.POA.AP6.model.AuthProvider;
import com.POA.AP6.model.User;
import com.POA.AP6.model.UserRole;
import java.time.LocalDateTime;
import java.util.UUID;

public record CurrentUserResponse(
		UUID id,
		String name,
		String email,
		AuthProvider provider,
		UserRole role,
		String avatarUrl,
		LocalDateTime createdAt
) {
	public static CurrentUserResponse from(User user) {
		return new CurrentUserResponse(
				user.getId(),
				user.getName(),
				user.getEmail(),
				user.getProvider(),
				user.getRole(),
				user.getAvatarUrl(),
				user.getCreatedAt());
	}
}
