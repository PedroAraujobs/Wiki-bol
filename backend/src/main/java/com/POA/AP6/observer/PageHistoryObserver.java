package com.POA.AP6.observer;

import com.POA.AP6.model.PageHistory;
import com.POA.AP6.repository.PageHistoryRepository;
import java.util.LinkedHashSet;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class PageHistoryObserver {
	private final PageHistoryRepository pageHistoryRepository;

	public PageHistoryObserver(PageHistoryRepository pageHistoryRepository) {
		this.pageHistoryRepository = pageHistoryRepository;
	}

	@Transactional
	@EventListener
	public void savePageHistory(PageChangedEvent event) {
		PageHistory history = PageHistory.builder()
				.page(event.page())
				.version(event.page().getCurrentVersion())
				.title(event.page().getTitle())
				.content(event.page().getContent())
				.keywords(new LinkedHashSet<>(event.page().getKeywords()))
				.editedBy(event.editedBy())
				.changeSummary(resolveSummary(event))
				.build();

		pageHistoryRepository.save(history);
	}

	private String resolveSummary(PageChangedEvent event) {
		if (event.changeSummary() != null && !event.changeSummary().isBlank()) {
			return event.changeSummary();
		}

		return switch (event.changeType()) {
			case CREATED -> "Pagina criada";
			case UPDATED -> "Pagina editada";
			case DELETED -> "Pagina removida";
		};
	}
}
