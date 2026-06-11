package com.POA.AP6.observer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;

import com.POA.AP6.model.AuthProvider;
import com.POA.AP6.model.Page;
import com.POA.AP6.model.PageChangeType;
import com.POA.AP6.model.PageHistory;
import com.POA.AP6.model.User;
import com.POA.AP6.repository.PageHistoryRepository;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PageHistoryObserverTest {
	@Mock
	private PageHistoryRepository pageHistoryRepository;

	@Test
	void savePageHistoryCopiesPageKeywordsToSnapshot() {
		PageHistoryObserver observer = new PageHistoryObserver(pageHistoryRepository);
		User user = user();
		Page page = Page.builder()
				.title("Spring Boot")
				.slug("spring-boot")
				.content("# Conteudo")
				.keywords(new LinkedHashSet<>(List.of("spring", "backend")))
				.currentVersion(2)
				.author(user)
				.build();
		page.setId(UUID.randomUUID());

		observer.savePageHistory(new PageChangedEvent(page, user, PageChangeType.UPDATED, "Atualizacao"));

		ArgumentCaptor<PageHistory> historyCaptor = ArgumentCaptor.forClass(PageHistory.class);
		verify(pageHistoryRepository).save(historyCaptor.capture());
		PageHistory history = historyCaptor.getValue();
		assertEquals(List.of("spring", "backend"), history.getKeywords().stream().toList());
		assertEquals("Atualizacao", history.getChangeSummary());
	}

	private User user() {
		User user = User.builder()
				.name("Pedro")
				.email("pedro@example.com")
				.provider(AuthProvider.GOOGLE)
				.providerId("google-id")
				.build();
		user.setId(UUID.randomUUID());
		return user;
	}
}
