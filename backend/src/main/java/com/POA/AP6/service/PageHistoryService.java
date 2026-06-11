package com.POA.AP6.service;

import com.POA.AP6.exception.ResourceNotFoundException;
import com.POA.AP6.model.Page;
import com.POA.AP6.model.PageHistory;
import com.POA.AP6.repository.PageHistoryRepository;
import com.POA.AP6.repository.PageRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PageHistoryService {
	private final PageHistoryRepository pageHistoryRepository;
	private final PageRepository pageRepository;

	public PageHistoryService(PageHistoryRepository pageHistoryRepository, PageRepository pageRepository) {
		this.pageHistoryRepository = pageHistoryRepository;
		this.pageRepository = pageRepository;
	}

	@Transactional(readOnly = true)
	public List<PageHistory> listByPage(UUID pageId) {
		validateActivePage(pageId);
		return pageHistoryRepository.findByPageIdOrderByVersionDesc(pageId);
	}

	@Transactional(readOnly = true)
	public PageHistory findByPageAndVersion(UUID pageId, Integer version) {
		validateActivePage(pageId);
		return pageHistoryRepository.findByPageIdAndVersion(pageId, version)
				.orElseThrow(() -> new ResourceNotFoundException("Versao do historico nao encontrada."));
	}

	private void validateActivePage(UUID pageId) {
		Page page = pageRepository.findById(pageId)
				.orElseThrow(() -> new ResourceNotFoundException("Pagina nao encontrada."));

		if (page.getDeletedAt() != null) {
			throw new ResourceNotFoundException("Pagina nao encontrada.");
		}
	}
}
