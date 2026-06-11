package com.POA.AP6.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.POA.AP6.dto.PageRequest;
import com.POA.AP6.exception.BusinessRuleException;
import com.POA.AP6.exception.ForbiddenException;
import com.POA.AP6.exception.ResourceNotFoundException;
import com.POA.AP6.model.AuthProvider;
import com.POA.AP6.model.Page;
import com.POA.AP6.model.PageHistory;
import com.POA.AP6.model.User;
import com.POA.AP6.model.UserRole;
import com.POA.AP6.observer.PageChangedEvent;
import com.POA.AP6.repository.PageHistoryRepository;
import com.POA.AP6.repository.PageRepository;
import com.POA.AP6.strategy.SlugGenerationStrategy;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

@ExtendWith(MockitoExtension.class)
class PageServiceTest {
	@Mock
	private PageRepository pageRepository;

	@Mock
	private PageHistoryRepository pageHistoryRepository;

	@Mock
	private SlugGenerationStrategy slugGenerationStrategy;

	@Mock
	private ApplicationEventPublisher eventPublisher;

	private PageService pageService;
	private User user;

	@BeforeEach
	void setUp() {
		pageService = new PageService(pageRepository, pageHistoryRepository, slugGenerationStrategy, eventPublisher);
		user = user();
	}

	@Test
	void createSavesPageWithGeneratedSlugAndPublishesEvent() {
		PageRequest request = new PageRequest("Titulo", "Conteudo", List.of(" Java ", "JAVA", "Backend"), "Criacao");
		when(slugGenerationStrategy.generateSlug("Titulo")).thenReturn("titulo");
		when(pageRepository.existsBySlug("titulo")).thenReturn(false);
		when(pageRepository.save(any(Page.class))).thenAnswer(invocation -> invocation.getArgument(0));

		Page page = pageService.create(request, user);

		assertEquals("Titulo", page.getTitle());
		assertEquals("titulo", page.getSlug());
		assertEquals(List.of("java", "backend"), page.getKeywords().stream().toList());
		assertEquals(1, page.getCurrentVersion());
		assertEquals(user, page.getAuthor());
		verify(pageRepository).save(page);
		verify(eventPublisher).publishEvent(any(PageChangedEvent.class));
	}

	@Test
	void createRejectsDuplicatedSlug() {
		PageRequest request = new PageRequest("Titulo", "Conteudo", null, null);
		when(slugGenerationStrategy.generateSlug("Titulo")).thenReturn("titulo");
		when(pageRepository.existsBySlug("titulo")).thenReturn(true);

		assertThrows(BusinessRuleException.class, () -> pageService.create(request, user));
	}

	@Test
	void updateChangesContentAndIncrementsVersion() {
		UUID id = UUID.randomUUID();
		Page page = page(id, "Antigo", "antigo", "Conteudo antigo", 1);
		User otherUser = user("maria@example.com", UserRole.USER);
		PageRequest request = new PageRequest("Novo", "Conteudo novo", List.of("Spring", "API"), "Edicao");
		when(pageRepository.findById(id)).thenReturn(Optional.of(page));
		when(pageRepository.save(page)).thenReturn(page);

		Page updated = pageService.update(id, request, otherUser);

		assertEquals("Novo", updated.getTitle());
		assertEquals("Conteudo novo", updated.getContent());
		assertEquals(List.of("spring", "api"), updated.getKeywords().stream().toList());
		assertEquals(2, updated.getCurrentVersion());
		verify(eventPublisher).publishEvent(any(PageChangedEvent.class));
	}

	@Test
	void searchReturnsResultsOrderedByRelevanceThenUpdatedAt() {
		Page exactTitle = page(UUID.randomUUID(), "Java", "java", "Conteudo", 1);
		exactTitle.setUpdatedAt(LocalDateTime.now().minusDays(4));
		Page keywordExact = page(UUID.randomUUID(), "Backend", "backend", "Conteudo", 1);
		keywordExact.setKeywords(new LinkedHashSet<>(List.of("java")));
		keywordExact.setUpdatedAt(LocalDateTime.now().minusDays(1));
		Page contentMatch = page(UUID.randomUUID(), "Outra", "outra", "Conteudo sobre Java", 1);
		contentMatch.setUpdatedAt(LocalDateTime.now());
		when(pageRepository.findByDeletedAtIsNullOrderByUpdatedAtDesc())
				.thenReturn(List.of(contentMatch, keywordExact, exactTitle));

		List<Page> result = pageService.search("java", 20);

		assertEquals(List.of(exactTitle, keywordExact, contentMatch), result);
	}

	@Test
	void searchReturnsActivePagesWhenQueryIsBlank() {
		Page page = page(UUID.randomUUID(), "Titulo", "titulo", "Conteudo", 1);
		when(pageRepository.findByDeletedAtIsNullOrderByUpdatedAtDesc()).thenReturn(List.of(page));

		List<Page> result = pageService.search(" ", 20);

		assertEquals(List.of(page), result);
	}

	@Test
	void searchRejectsQueryLongerThanOneHundredCharacters() {
		String query = "a".repeat(101);

		assertThrows(BusinessRuleException.class, () -> pageService.search(query, 20));
	}

	@Test
	void searchRejectsInvalidLimit() {
		assertThrows(BusinessRuleException.class, () -> pageService.search("java", 51));
	}

	@Test
	void searchUsesDefaultLimitWhenLimitIsNull() {
		List<Page> pages = java.util.stream.IntStream.range(0, 25)
				.mapToObj(index -> page(UUID.randomUUID(), "Java " + index, "java-" + index, "Conteudo", 1))
				.toList();
		when(pageRepository.findByDeletedAtIsNullOrderByUpdatedAtDesc()).thenReturn(pages);

		List<Page> result = pageService.search("java", null);

		assertEquals(20, result.size());
	}

	@Test
	void deleteMarksPageAsDeletedAndPublishesEvent() {
		UUID id = UUID.randomUUID();
		Page page = page(id, "Titulo", "titulo", "Conteudo", 1);
		when(pageRepository.findById(id)).thenReturn(Optional.of(page));
		when(pageRepository.save(page)).thenReturn(page);

		pageService.delete(id, user);

		assertNotNull(page.getDeletedAt());
		assertEquals(2, page.getCurrentVersion());

		ArgumentCaptor<PageChangedEvent> eventCaptor = ArgumentCaptor.forClass(PageChangedEvent.class);
		verify(eventPublisher).publishEvent(eventCaptor.capture());
		assertEquals("Pagina removida", eventCaptor.getValue().changeSummary());
	}

	@Test
	void deleteAllowsAdminWhenNotAuthor() {
		UUID id = UUID.randomUUID();
		Page page = page(id, "Titulo", "titulo", "Conteudo", 1);
		User admin = user("admin@example.com", UserRole.ADMIN);
		when(pageRepository.findById(id)).thenReturn(Optional.of(page));
		when(pageRepository.save(page)).thenReturn(page);

		pageService.delete(id, admin);

		assertNotNull(page.getDeletedAt());
		assertEquals(2, page.getCurrentVersion());
		verify(eventPublisher).publishEvent(any(PageChangedEvent.class));
	}

	@Test
	void deleteRejectsUserThatIsNotAuthorOrAdmin() {
		UUID id = UUID.randomUUID();
		Page page = page(id, "Titulo", "titulo", "Conteudo", 1);
		User otherUser = user("maria@example.com", UserRole.USER);
		when(pageRepository.findById(id)).thenReturn(Optional.of(page));

		assertThrows(ForbiddenException.class, () -> pageService.delete(id, otherUser));
	}

	@Test
	void restoreVersionCopiesHistorySnapshotAndPublishesEvent() {
		UUID id = UUID.randomUUID();
		Page page = page(id, "Atual", "pagina", "Conteudo atual", 3);
		PageHistory history = PageHistory.builder()
				.version(1)
				.title("Antigo")
				.content("Conteudo antigo")
				.keywords(new LinkedHashSet<>(List.of("java", "wiki")))
				.build();
		when(pageRepository.findById(id)).thenReturn(Optional.of(page));
		when(pageHistoryRepository.findByPageIdAndVersion(id, 1)).thenReturn(Optional.of(history));
		when(pageRepository.save(page)).thenReturn(page);

		Page restored = pageService.restoreVersion(id, 1, user);

		assertEquals("Antigo", restored.getTitle());
		assertEquals("pagina", restored.getSlug());
		assertEquals("Conteudo antigo", restored.getContent());
		assertEquals(List.of("java", "wiki"), restored.getKeywords().stream().toList());
		assertEquals(4, restored.getCurrentVersion());

		ArgumentCaptor<PageChangedEvent> eventCaptor = ArgumentCaptor.forClass(PageChangedEvent.class);
		verify(eventPublisher).publishEvent(eventCaptor.capture());
		assertEquals("Restaurada versao 1", eventCaptor.getValue().changeSummary());
	}

	@Test
	void restoreVersionAllowsAdminWhenNotAuthor() {
		UUID id = UUID.randomUUID();
		User admin = user("admin@example.com", UserRole.ADMIN);
		Page page = page(id, "Atual", "pagina", "Conteudo atual", 3);
		PageHistory history = PageHistory.builder()
				.version(1)
				.title("Antigo")
				.content("Conteudo antigo")
				.keywords(new LinkedHashSet<>(List.of("java", "wiki")))
				.build();
		when(pageRepository.findById(id)).thenReturn(Optional.of(page));
		when(pageHistoryRepository.findByPageIdAndVersion(id, 1)).thenReturn(Optional.of(history));
		when(pageRepository.save(page)).thenReturn(page);

		Page restored = pageService.restoreVersion(id, 1, admin);

		assertEquals("Antigo", restored.getTitle());
		assertEquals(4, restored.getCurrentVersion());
		verify(eventPublisher).publishEvent(any(PageChangedEvent.class));
	}

	@Test
	void restoreVersionRejectsUserThatIsNotAuthorOrAdmin() {
		UUID id = UUID.randomUUID();
		Page page = page(id, "Atual", "pagina", "Conteudo atual", 3);
		User otherUser = user("maria@example.com", UserRole.USER);
		when(pageRepository.findById(id)).thenReturn(Optional.of(page));

		assertThrows(ForbiddenException.class, () -> pageService.restoreVersion(id, 1, otherUser));
	}

	@Test
	void restoreVersionThrowsWhenPageIsDeleted() {
		UUID id = UUID.randomUUID();
		Page page = page(id, "Atual", "pagina", "Conteudo atual", 3);
		page.setDeletedAt(LocalDateTime.now());
		when(pageRepository.findById(id)).thenReturn(Optional.of(page));

		assertThrows(ResourceNotFoundException.class, () -> pageService.restoreVersion(id, 1, user));
	}

	@Test
	void restoreVersionThrowsWhenHistoryVersionDoesNotExist() {
		UUID id = UUID.randomUUID();
		Page page = page(id, "Atual", "pagina", "Conteudo atual", 3);
		when(pageRepository.findById(id)).thenReturn(Optional.of(page));
		when(pageHistoryRepository.findByPageIdAndVersion(id, 99)).thenReturn(Optional.empty());

		assertThrows(ResourceNotFoundException.class, () -> pageService.restoreVersion(id, 99, user));
	}

	private Page page(UUID id, String title, String slug, String content, int version) {
		Page page = Page.builder()
				.title(title)
				.slug(slug)
				.content(content)
				.keywords(new LinkedHashSet<>())
				.currentVersion(version)
				.author(user)
				.build();
		page.setId(id);
		page.setUpdatedAt(LocalDateTime.now());
		return page;
	}

	private User user() {
		return user("pedro@example.com", UserRole.USER);
	}

	private User user(String email, UserRole role) {
		User user = User.builder()
				.name("Pedro")
				.email(email)
				.provider(AuthProvider.GOOGLE)
				.providerId(email)
				.role(role)
				.build();
		user.setId(UUID.randomUUID());
		return user;
	}
}
