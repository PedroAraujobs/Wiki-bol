package com.POA.AP6.repository;

import com.POA.AP6.model.Page;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PageRepository extends JpaRepository<Page, UUID> {
	@EntityGraph(attributePaths = {"author", "keywords"})
	List<Page> findByDeletedAtIsNullOrderByUpdatedAtDesc();

	@EntityGraph(attributePaths = {"author", "keywords"})
	Optional<Page> findBySlugAndDeletedAtIsNull(String slug);

	boolean existsBySlug(String slug);
}
