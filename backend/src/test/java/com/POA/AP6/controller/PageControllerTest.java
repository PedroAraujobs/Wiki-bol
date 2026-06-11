package com.POA.AP6.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.POA.AP6.dto.PageRequest;
import com.POA.AP6.exception.ForbiddenException;
import com.POA.AP6.model.AuthProvider;
import com.POA.AP6.model.Page;
import com.POA.AP6.model.User;
import com.POA.AP6.model.UserRole;
import com.POA.AP6.service.ImageUploadService;
import com.POA.AP6.service.PageHistoryService;
import com.POA.AP6.service.PageService;
import com.POA.AP6.service.UserService;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
		"spring.datasource.url=jdbc:h2:mem:page_controller_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.security.oauth2.client.registration.google.client-id=test-client-id",
		"spring.security.oauth2.client.registration.google.client-secret=test-client-secret",
		"supabase.service-role-key=test-service-role-key"
})
class PageControllerTest {
	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private PageService pageService;

	@MockitoBean
	private PageHistoryService pageHistoryService;

	@MockitoBean
	private UserService userService;

	@MockitoBean
	private ImageUploadService imageUploadService;

	@Test
	void listReturnsPublicPages() throws Exception {
		when(pageService.listActivePages()).thenReturn(List.of(page(user())));

		mockMvc.perform(get("/api/pages"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].title").value("Pagina teste"))
				.andExpect(jsonPath("$[0].slug").value("pagina-teste"));
	}

	@Test
	void searchReturnsPublicPages() throws Exception {
		when(pageService.search("spring", 10)).thenReturn(List.of(page(user())));

		mockMvc.perform(get("/api/pages/search").param("q", "spring").param("limit", "10"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].title").value("Pagina teste"))
				.andExpect(jsonPath("$[0].keywords[0]").value("spring"));
	}

	@Test
	void createReturnsCreatedPageWhenAuthenticated() throws Exception {
		User user = user();
		Page page = page(user);
		when(userService.getCurrentUser(any(OAuth2AuthenticationToken.class))).thenReturn(user);
		when(pageService.create(any(PageRequest.class), eq(user))).thenReturn(page);

		mockMvc.perform(post("/api/pages")
						.with(oauth2Login())
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "title": "Pagina teste",
								  "content": "# Conteudo",
								  "keywords": ["Spring", "Backend"],
								  "changeSummary": "Criacao"
								}
								"""))
				.andExpect(status().isCreated())
				.andExpect(jsonPath("$.title").value("Pagina teste"))
				.andExpect(jsonPath("$.keywords[0]").value("spring"))
				.andExpect(jsonPath("$.author.name").value("Pedro"));
	}

	@Test
	void createWithoutAuthenticationReturnsJsonUnauthorized() throws Exception {
		mockMvc.perform(post("/api/pages")
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "title": "Pagina teste",
								  "content": "# Conteudo"
								}
								"""))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.error").value("Unauthorized"))
				.andExpect(jsonPath("$.messages[0]").value("Autenticacao obrigatoria."));
	}

	@Test
	void createRejectsInvalidPayload() throws Exception {
		mockMvc.perform(post("/api/pages")
						.with(oauth2Login())
						.contentType(MediaType.APPLICATION_JSON)
						.content("{}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Validation Error"));
	}

	@Test
	void createRejectsTooLongKeyword() throws Exception {
		mockMvc.perform(post("/api/pages")
						.with(oauth2Login())
						.contentType(MediaType.APPLICATION_JSON)
						.content("""
								{
								  "title": "Pagina teste",
								  "content": "# Conteudo",
								  "keywords": ["uma-keyword-com-mais-de-cinquenta-caracteres-para-validar"]
								}
								"""))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Validation Error"));
	}

	@Test
	void restoreVersionReturnsPageWhenAuthenticated() throws Exception {
		User user = user();
		Page page = page(user);
		UUID pageId = page.getId();
		when(userService.getCurrentUser(any(OAuth2AuthenticationToken.class))).thenReturn(user);
		when(pageService.restoreVersion(pageId, 1, user)).thenReturn(page);

		mockMvc.perform(post("/api/pages/{id}/history/{version}/restore", pageId, 1)
						.with(oauth2Login()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(pageId.toString()))
				.andExpect(jsonPath("$.title").value("Pagina teste"));
	}

	@Test
	void deleteWithoutAuthenticationReturnsJsonUnauthorized() throws Exception {
		mockMvc.perform(delete("/api/pages/{id}", UUID.randomUUID()))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.error").value("Unauthorized"))
				.andExpect(jsonPath("$.messages[0]").value("Autenticacao obrigatoria."));
	}

	@Test
	void restoreVersionWithoutAuthenticationReturnsJsonUnauthorized() throws Exception {
		mockMvc.perform(post("/api/pages/{id}/history/{version}/restore", UUID.randomUUID(), 1))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.error").value("Unauthorized"))
				.andExpect(jsonPath("$.messages[0]").value("Autenticacao obrigatoria."));
	}

	@Test
	void deleteReturnsForbiddenWhenServiceRejectsPermission() throws Exception {
		User user = user();
		UUID pageId = UUID.randomUUID();
		when(userService.getCurrentUser(any(OAuth2AuthenticationToken.class))).thenReturn(user);
		doThrow(new ForbiddenException("Voce nao tem permissao para executar esta acao."))
				.when(pageService).delete(pageId, user);

		mockMvc.perform(delete("/api/pages/{id}", pageId)
						.with(oauth2Login()))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Forbidden"))
				.andExpect(jsonPath("$.messages[0]").value("Voce nao tem permissao para executar esta acao."));
	}

	@Test
	void restoreVersionReturnsForbiddenWhenServiceRejectsPermission() throws Exception {
		User user = user();
		UUID pageId = UUID.randomUUID();
		when(userService.getCurrentUser(any(OAuth2AuthenticationToken.class))).thenReturn(user);
		when(pageService.restoreVersion(pageId, 1, user))
				.thenThrow(new ForbiddenException("Voce nao tem permissao para executar esta acao."));

		mockMvc.perform(post("/api/pages/{id}/history/{version}/restore", pageId, 1)
						.with(oauth2Login()))
				.andExpect(status().isForbidden())
				.andExpect(jsonPath("$.error").value("Forbidden"))
				.andExpect(jsonPath("$.messages[0]").value("Voce nao tem permissao para executar esta acao."));
	}

	private Page page(User user) {
		Page page = Page.builder()
				.title("Pagina teste")
				.slug("pagina-teste")
				.content("# Conteudo")
				.keywords(new java.util.LinkedHashSet<>(List.of("spring", "backend")))
				.currentVersion(1)
				.author(user)
				.build();
		page.setId(UUID.randomUUID());
		page.setCreatedAt(LocalDateTime.now());
		page.setUpdatedAt(LocalDateTime.now());
		return page;
	}

	private User user() {
		User user = User.builder()
				.name("Pedro")
				.email("pedro@example.com")
				.provider(AuthProvider.GOOGLE)
				.providerId("google-id")
				.role(UserRole.USER)
				.build();
		user.setId(UUID.randomUUID());
		user.setCreatedAt(LocalDateTime.now());
		user.setUpdatedAt(LocalDateTime.now());
		return user;
	}
}
