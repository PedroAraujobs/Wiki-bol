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
		name = "page_history",
		uniqueConstraints = @UniqueConstraint(name = "uk_page_history_page_version", columnNames = {"page_id", "version"}),
		indexes = @Index(name = "idx_page_history_page_version", columnList = "page_id, version"))
public class PageHistory {
	@Id
	@GeneratedValue
	private UUID id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "page_id", nullable = false)
	private Page page;

	@Column(nullable = false)
	private Integer version;

	@Column(nullable = false)
	private String title;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String content;

	@Builder.Default
	@ElementCollection
	@CollectionTable(
			name = "page_history_keywords",
			joinColumns = @JoinColumn(name = "history_id"),
			uniqueConstraints = @UniqueConstraint(name = "uk_page_history_keywords_history_keyword", columnNames = {"history_id", "keyword"}))
	@Column(name = "keyword", nullable = false, length = 50)
	private Set<String> keywords = new LinkedHashSet<>();

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "edited_by_id", nullable = false)
	private User editedBy;

	@Column(name = "change_summary")
	private String changeSummary;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@PrePersist
	void onCreate() {
		createdAt = LocalDateTime.now();
	}
}
