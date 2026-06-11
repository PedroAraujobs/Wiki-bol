package com.POA.AP6.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
		name = "users",
		indexes = {
				@Index(name = "idx_users_email", columnList = "email"),
				@Index(name = "idx_users_provider_provider_id", columnList = "provider, provider_id")
		})
public class User {
	@Id
	@GeneratedValue
	private UUID id;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false, unique = true)
	private String email;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private AuthProvider provider;

	@Builder.Default
	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private UserRole role = UserRole.USER;

	@Column(name = "provider_id", nullable = false)
	private String providerId;

	@Column(name = "avatar_url", columnDefinition = "TEXT")
	private String avatarUrl;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	@PrePersist
	void onCreate() {
		LocalDateTime now = LocalDateTime.now();
		if (role == null) {
			role = UserRole.USER;
		}
		createdAt = now;
		updatedAt = now;
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = LocalDateTime.now();
	}
}
