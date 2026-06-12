package com.POA.AP6.service;

import com.POA.AP6.dto.PageRequest;
import com.POA.AP6.exception.BusinessRuleException;
import com.POA.AP6.exception.ForbiddenException;
import com.POA.AP6.exception.ResourceNotFoundException;
import com.POA.AP6.model.Page;
import com.POA.AP6.model.PageChangeType;
import com.POA.AP6.model.PageHistory;
import com.POA.AP6.model.User;
import com.POA.AP6.model.UserRole;
import com.POA.AP6.observer.PageChangedEvent;
import com.POA.AP6.repository.PageHistoryRepository;
import com.POA.AP6.repository.PageRepository;
import com.POA.AP6.strategy.SlugGenerationStrategy;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PageService {
	private static final int MAX_KEYWORDS = 20;
	private static final int MAX_KEYWORD_LENGTH = 50;
	private static final int MAX_SEARCH_QUERY_LENGTH = 100;
	private static final int DEFAULT_SEARCH_LIMIT = 20;
	private static final int MAX_SEARCH_LIMIT = 50;
	private static final Map<String, String> KEYWORD_ALIASES = Map.ofEntries(
			Map.entry("manga", "manga"),
			Map.entry("mangas", "manga"),
			Map.entry("personagem", "personagem"),
			Map.entry("personagens", "personagem"),
			Map.entry("time", "time"),
			Map.entry("times", "time"),
			Map.entry("clube", "time"),
			Map.entry("clubes", "time"),
			Map.entry("equipe", "time"),
			Map.entry("equipes", "time"),
			Map.entry("partida", "partida"),
			Map.entry("partidas", "partida"),
			Map.entry("jogo", "partida"),
			Map.entry("jogos", "partida"),
			Map.entry("autor", "autor"),
			Map.entry("autores", "autor"),
			Map.entry("mangaka", "autor"),
			Map.entry("roteirista", "autor"),
			Map.entry("ilustrador", "autor"),
			Map.entry("arco", "arco"),
			Map.entry("arcos", "arco"),
			Map.entry("saga", "arco"),
			Map.entry("sagas", "arco"));

	private final PageRepository pageRepository;
	private final PageHistoryRepository pageHistoryRepository;
	private final SlugGenerationStrategy slugGenerationStrategy;
	private final ApplicationEventPublisher eventPublisher;

	public PageService(
			PageRepository pageRepository,
			PageHistoryRepository pageHistoryRepository,
			SlugGenerationStrategy slugGenerationStrategy,
			ApplicationEventPublisher eventPublisher) {
		this.pageRepository = pageRepository;
		this.pageHistoryRepository = pageHistoryRepository;
		this.slugGenerationStrategy = slugGenerationStrategy;
		this.eventPublisher = eventPublisher;
	}

	@Transactional(readOnly = true)
	public List<Page> listActivePages() {
		return pageRepository.findByDeletedAtIsNullOrderByUpdatedAtDesc();
	}

	@Transactional(readOnly = true)
	public List<Page> search(String query, Integer limit) {
		int resolvedLimit = resolveSearchLimit(limit);
		if (query == null || query.isBlank()) {
			return listActivePages().stream()
					.limit(resolvedLimit)
					.toList();
		}

		String normalizedQuery = normalizeText(query);
		if (normalizedQuery.length() > MAX_SEARCH_QUERY_LENGTH) {
			throw new BusinessRuleException("A busca deve ter no maximo 100 caracteres.");
		}
		String canonicalKeywordQuery = canonicalizeKeyword(normalizedQuery);

		return pageRepository.findByDeletedAtIsNullOrderByUpdatedAtDesc().stream()
				.map(page -> new SearchResult(page, relevanceScore(page, normalizedQuery, canonicalKeywordQuery)))
				.filter(result -> result.score() > 0)
				.sorted(Comparator
						.comparingInt(SearchResult::score).reversed()
						.thenComparing(result -> result.page().getUpdatedAt(), Comparator.reverseOrder()))
				.map(SearchResult::page)
				.limit(resolvedLimit)
				.toList();
	}

	@Transactional(readOnly = true)
	public Page findBySlug(String slug) {
		return pageRepository.findBySlugAndDeletedAtIsNull(slug)
				.orElseThrow(() -> new ResourceNotFoundException("Pagina nao encontrada."));
	}

	@Transactional
	public Page create(PageRequest request, User author) {
		String slug = slugGenerationStrategy.generateSlug(request.title());
		if (pageRepository.existsBySlug(slug)) {
			throw new BusinessRuleException("Ja existe uma pagina com esse titulo/slug.");
		}

		Page page = Page.builder()
				.title(request.title())
				.slug(slug)
				.content(request.content())
				.keywords(normalizeKeywords(request.keywords()))
				.currentVersion(1)
				.author(author)
				.build();

		Page savedPage = pageRepository.save(page);
		eventPublisher.publishEvent(new PageChangedEvent(savedPage, author, PageChangeType.CREATED, request.changeSummary()));
		return savedPage;
	}

	@Transactional
	public Page update(UUID id, PageRequest request, User editor) {
		Page page = findActiveById(id);

		page.setTitle(request.title());
		page.setContent(request.content());
		page.setKeywords(normalizeKeywords(request.keywords()));
		page.setCurrentVersion(page.getCurrentVersion() + 1);

		Page savedPage = pageRepository.save(page);
		eventPublisher.publishEvent(new PageChangedEvent(savedPage, editor, PageChangeType.UPDATED, request.changeSummary()));
		return savedPage;
	}

	@Transactional
	public void delete(UUID id, User editor) {
		Page page = findActiveById(id);
		validateAuthorOrAdmin(page, editor);
		page.setDeletedAt(LocalDateTime.now());
		page.setCurrentVersion(page.getCurrentVersion() + 1);

		Page savedPage = pageRepository.save(page);
		eventPublisher.publishEvent(new PageChangedEvent(savedPage, editor, PageChangeType.DELETED, "Pagina removida"));
	}

	@Transactional
	public Page restoreVersion(UUID id, Integer version, User editor) {
		Page page = findActiveById(id);
		validateAuthorOrAdmin(page, editor);
		PageHistory history = pageHistoryRepository.findByPageIdAndVersion(id, version)
				.orElseThrow(() -> new ResourceNotFoundException("Versao do historico nao encontrada."));

		page.setTitle(history.getTitle());
		page.setContent(history.getContent());
		page.setKeywords(new LinkedHashSet<>(history.getKeywords()));
		page.setCurrentVersion(page.getCurrentVersion() + 1);

		Page savedPage = pageRepository.save(page);
		eventPublisher.publishEvent(new PageChangedEvent(savedPage, editor, PageChangeType.UPDATED, "Restaurada versao " + version));
		return savedPage;
	}

	private Page findActiveById(UUID id) {
		Page page = pageRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Pagina nao encontrada."));

		if (page.getDeletedAt() != null) {
			throw new ResourceNotFoundException("Pagina nao encontrada.");
		}

		return page;
	}

	private void validateAuthorOrAdmin(Page page, User editor) {
		if (isAdmin(editor) || isAuthor(page, editor)) {
			return;
		}

		throw new ForbiddenException("Voce nao tem permissao para executar esta acao.");
	}

	private boolean isAdmin(User user) {
		return user != null && UserRole.ADMIN.equals(user.getRole());
	}

	private boolean isAuthor(Page page, User user) {
		return page.getAuthor() != null
				&& page.getAuthor().getId() != null
				&& user != null
				&& page.getAuthor().getId().equals(user.getId());
	}

	private Set<String> normalizeKeywords(List<String> keywords) {
		if (keywords == null || keywords.isEmpty()) {
			return new LinkedHashSet<>();
		}

		Set<String> normalizedKeywords = new LinkedHashSet<>();
		for (String keyword : keywords) {
			if (keyword == null || keyword.isBlank()) {
				continue;
			}

			String normalizedKeyword = canonicalizeKeyword(normalizeText(keyword));
			if (normalizedKeyword.isBlank()) {
				continue;
			}

			if (normalizedKeyword.length() > MAX_KEYWORD_LENGTH) {
				throw new BusinessRuleException("Cada keyword deve ter no maximo 50 caracteres.");
			}

			normalizedKeywords.add(normalizedKeyword);
		}

		if (normalizedKeywords.size() > MAX_KEYWORDS) {
			throw new BusinessRuleException("Uma pagina pode ter no maximo 20 keywords.");
		}

		return normalizedKeywords;
	}

	private String normalizeText(String value) {
		String withoutDiacritics = Normalizer.normalize(value.trim(), Normalizer.Form.NFD)
				.replaceAll("\\p{M}", "");
		return withoutDiacritics
				.toLowerCase(Locale.ROOT)
				.replaceAll("\\s+", " ");
	}

	private String canonicalizeKeyword(String keyword) {
		return KEYWORD_ALIASES.getOrDefault(keyword, keyword);
	}

	private int resolveSearchLimit(Integer limit) {
		if (limit == null) {
			return DEFAULT_SEARCH_LIMIT;
		}

		if (limit < 1 || limit > MAX_SEARCH_LIMIT) {
			throw new BusinessRuleException("O limite da busca deve estar entre 1 e 50.");
		}

		return limit;
	}

	private int relevanceScore(Page page, String query, String canonicalKeywordQuery) {
		String title = normalizeText(page.getTitle());
		String slug = normalizeText(page.getSlug());
		String content = normalizeText(page.getContent());

		if (title.equals(query)) {
			return 100;
		}

		if (title.startsWith(query)) {
			return 80;
		}

		if (page.getKeywords().stream().map(this::normalizeStoredKeyword).anyMatch(keyword -> keyword.equals(canonicalKeywordQuery))) {
			return 70;
		}

		if (title.contains(query)) {
			return 60;
		}

		if (page.getKeywords().stream().map(this::normalizeStoredKeyword).anyMatch(keyword -> keyword.contains(canonicalKeywordQuery))) {
			return 50;
		}

		if (slug.contains(query)) {
			return 40;
		}

		if (content.contains(query)) {
			return 20;
		}

		return 0;
	}

	private record SearchResult(Page page, int score) {
	}

	private String normalizeStoredKeyword(String keyword) {
		return canonicalizeKeyword(normalizeText(keyword));
	}
}
