package com.POA.AP6.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;
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
		name = "pages",
		indexes = {
				@Index(name = "idx_pages_slug", columnList = "slug"),
				@Index(name = "idx_pages_deleted_at", columnList = "deleted_at")
		})
public class Page {
	@Id
	@GeneratedValue
	private UUID id;

	@Column(nullable = false)
	private String title;

	@Column(nullable = false, unique = true)
	private String slug;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String content;

	@Builder.Default
	@ElementCollection
	@CollectionTable(
			name = "page_keywords",
			joinColumns = @JoinColumn(name = "page_id"),
			uniqueConstraints = @UniqueConstraint(name = "uk_page_keywords_page_keyword", columnNames = {"page_id", "keyword"}))
	@Column(name = "keyword", nullable = false, length = 50)
	private Set<String> keywords = new LinkedHashSet<>();

	@Column(name = "current_version", nullable = false)
	private Integer currentVersion;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "author_id", nullable = false)
	private User author;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	@Column(name = "deleted_at")
	private LocalDateTime deletedAt;

	@PrePersist
	void onCreate() {
		LocalDateTime now = LocalDateTime.now();
		createdAt = now;
		updatedAt = now;
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = LocalDateTime.now();
	}
}
