package com.POA.AP6.controller;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.POA.AP6.model.AuthProvider;
import com.POA.AP6.model.Page;
import com.POA.AP6.model.User;
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
		"spring.datasource.url=jdbc:h2:mem:page_search_integration_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.security.oauth2.client.registration.google.client-id=test-client-id",
		"spring.security.oauth2.client.registration.google.client-secret=test-client-secret",
		"supabase.service-role-key=test-service-role-key"
})
class PageSearchIntegrationTest {
	@Autowired
	private MockMvc mockMvc;

	@Autowired
	private PageRepository pageRepository;

	@Autowired
	private UserRepository userRepository;

	private User author;

	@BeforeEach
	void setUp() {
		pageRepository.deleteAll();
		userRepository.deleteAll();
		author = userRepository.save(User.builder()
				.name("Pedro")
				.email("pedro-search@example.com")
				.provider(AuthProvider.GOOGLE)
				.providerId("pedro-search")
				.build());
	}

	@Test
	void searchByAccentedMangaReturnsPagesWithAsciiAndLegacyAccentedKeywords() throws Exception {
		pageRepository.save(page("Ao Ashi", "ao-ashi", List.of("manga", "futebol")));
		pageRepository.save(page("Blue Lock", "blue-lock", List.of("manga", "atacante")));
		pageRepository.save(page("Inazuma Eleven", "inazuma-eleven", List.of("mang\u00e1", "super onze")));

		mockMvc.perform(get("/api/pages/search").param("q", "mang\u00e1").param("limit", "20"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[*].title", containsInAnyOrder("Ao Ashi", "Blue Lock", "Inazuma Eleven")));
	}

	private Page page(String title, String slug, List<String> keywords) {
		return Page.builder()
				.title(title)
				.slug(slug)
				.content("Conteudo")
				.keywords(new LinkedHashSet<>(keywords))
				.currentVersion(1)
				.author(author)
				.build();
	}
}
