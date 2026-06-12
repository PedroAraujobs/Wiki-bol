package com.POA.AP6.controller;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.POA.AP6.model.AuthProvider;
import com.POA.AP6.model.Page;
import com.POA.AP6.model.PageHistory;
import com.POA.AP6.model.User;
import com.POA.AP6.repository.PageHistoryRepository;
import com.POA.AP6.repository.PageRepository;
import com.POA.AP6.repository.UserRepository;
import java.util.LinkedHashSet;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
		"spring.datasource.url=jdbc:h2:mem:page_history_integration_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.security.oauth2.client.registration.google.client-id=test-client-id",
		"spring.security.oauth2.client.registration.google.client-secret=test-client-secret",
		"supabase.service-role-key=test-service-role-key"
})
class PageHistoryIntegrationTest {
	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private PageRepository pageRepository;

	@Autowired
	private PageHistoryRepository pageHistoryRepository;

	@Autowired
	private UserRepository userRepository;

	private User author;
	private Page page;

	@BeforeEach
	void setUp() {
		pageHistoryRepository.deleteAll();
		pageRepository.deleteAll();
		userRepository.deleteAll();

		author = userRepository.save(User.builder()
				.name("Pedro")
				.email("pedro-history@example.com")
				.provider(AuthProvider.GOOGLE)
				.providerId("pedro-history")
				.build());

		page = pageRepository.save(Page.builder()
				.title("Ao Ashi")
				.slug("ao-ashi")
				.content("Conteudo atual")
				.keywords(new LinkedHashSet<>(List.of("manga", "futebol")))
				.currentVersion(3)
				.author(author)
				.build());

		pageHistoryRepository.save(history(1, "Ao Ashi inicial", "Conteudo inicial", "Criacao"));
		pageHistoryRepository.save(history(2, "Ao Ashi revisado", "Conteudo revisado", "Revisao"));
	}

	@Test
	void historyEndpointReturnsRealSnapshotsOrderedByVersionDesc() throws Exception {
		mockMvc.perform(get("/api/pages/{id}/history", page.getId()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$", hasSize(2)))
				.andExpect(jsonPath("$[*].version", contains(2, 1)))
				.andExpect(jsonPath("$[0].title").value("Ao Ashi revisado"))
				.andExpect(jsonPath("$[0].editedByName").value("Pedro"))
				.andExpect(jsonPath("$[0].changeSummary").value("Revisao"));
	}

	@Test
	void restoreEndpointRestoresSnapshotThroughRealServices() throws Exception {
		mockMvc.perform(post("/api/pages/{id}/history/{version}/restore", page.getId(), 1)
						.with(oauth2Login().attributes(attributes -> {
							attributes.put("sub", "pedro-history");
							attributes.put("email", "pedro-history@example.com");
							attributes.put("name", "Pedro");
						})))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.title").value("Ao Ashi inicial"))
				.andExpect(jsonPath("$.content").value("Conteudo inicial"))
				.andExpect(jsonPath("$.currentVersion").value(4))
				.andExpect(jsonPath("$.keywords[0]").value("manga"));
	}

	private PageHistory history(Integer version, String title, String content, String changeSummary) {
		return PageHistory.builder()
				.page(page)
				.version(version)
				.title(title)
				.content(content)
				.keywords(new LinkedHashSet<>(List.of("manga", "futebol")))
				.editedBy(author)
				.changeSummary(changeSummary)
				.build();
	}
}
