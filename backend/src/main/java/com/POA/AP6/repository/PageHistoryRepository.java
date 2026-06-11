package com.POA.AP6.repository;

import com.POA.AP6.model.PageHistory;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PageHistoryRepository extends JpaRepository<PageHistory, UUID> {
	@EntityGraph(attributePaths = {"page", "editedBy", "keywords"})
	List<PageHistory> findByPageIdOrderByVersionDesc(UUID pageId);

	@EntityGraph(attributePaths = {"page", "editedBy", "keywords"})
	Optional<PageHistory> findByPageIdAndVersion(UUID pageId, Integer version);
}
