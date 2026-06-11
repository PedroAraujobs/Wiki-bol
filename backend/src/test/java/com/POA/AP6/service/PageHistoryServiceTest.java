package com.POA.AP6.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.POA.AP6.exception.ResourceNotFoundException;
import com.POA.AP6.model.Page;
import com.POA.AP6.model.PageHistory;
import com.POA.AP6.repository.PageHistoryRepository;
import com.POA.AP6.repository.PageRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PageHistoryServiceTest {
	@Mock
	private PageHistoryRepository pageHistoryRepository;

	@Mock
	private PageRepository pageRepository;

	private PageHistoryService pageHistoryService;

	@BeforeEach
	void setUp() {
		pageHistoryService = new PageHistoryService(pageHistoryRepository, pageRepository);
	}

	@Test
	void listByPageReturnsHistoryOrderedByRepository() {
		UUID pageId = UUID.randomUUID();
		PageHistory first = PageHistory.builder().version(2).build();
		PageHistory second = PageHistory.builder().version(1).build();
		when(pageRepository.findById(pageId)).thenReturn(Optional.of(activePage(pageId)));
		when(pageHistoryRepository.findByPageIdOrderByVersionDesc(pageId)).thenReturn(List.of(first, second));

		List<PageHistory> result = pageHistoryService.listByPage(pageId);

		assertEquals(List.of(first, second), result);
	}

	@Test
	void findByPageAndVersionReturnsHistory() {
		UUID pageId = UUID.randomUUID();
		PageHistory history = PageHistory.builder().version(1).build();
		when(pageRepository.findById(pageId)).thenReturn(Optional.of(activePage(pageId)));
		when(pageHistoryRepository.findByPageIdAndVersion(pageId, 1)).thenReturn(Optional.of(history));

		PageHistory result = pageHistoryService.findByPageAndVersion(pageId, 1);

		assertEquals(history, result);
	}

	@Test
	void findByPageAndVersionThrowsWhenMissing() {
		UUID pageId = UUID.randomUUID();
		when(pageRepository.findById(pageId)).thenReturn(Optional.of(activePage(pageId)));
		when(pageHistoryRepository.findByPageIdAndVersion(pageId, 99)).thenReturn(Optional.empty());

		assertThrows(ResourceNotFoundException.class, () -> pageHistoryService.findByPageAndVersion(pageId, 99));
	}

	@Test
	void listByPageThrowsWhenPageDoesNotExist() {
		UUID pageId = UUID.randomUUID();
		when(pageRepository.findById(pageId)).thenReturn(Optional.empty());

		assertThrows(ResourceNotFoundException.class, () -> pageHistoryService.listByPage(pageId));
	}

	@Test
	void listByPageThrowsWhenPageIsDeleted() {
		UUID pageId = UUID.randomUUID();
		Page page = activePage(pageId);
		page.setDeletedAt(LocalDateTime.now());
		when(pageRepository.findById(pageId)).thenReturn(Optional.of(page));

		assertThrows(ResourceNotFoundException.class, () -> pageHistoryService.listByPage(pageId));
	}

	private Page activePage(UUID pageId) {
		Page page = Page.builder()
				.title("Pagina")
				.slug("pagina")
				.content("Conteudo")
				.currentVersion(1)
				.build();
		page.setId(pageId);
		return page;
	}
}
