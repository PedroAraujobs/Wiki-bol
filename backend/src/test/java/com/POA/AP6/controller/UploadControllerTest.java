package com.POA.AP6.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.POA.AP6.dto.ImageUploadResponse;
import com.POA.AP6.model.AuthProvider;
import com.POA.AP6.model.User;
import com.POA.AP6.service.ImageUploadService;
import com.POA.AP6.service.PageHistoryService;
import com.POA.AP6.service.PageService;
import com.POA.AP6.service.UserService;
import java.time.LocalDateTime;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
		"spring.datasource.url=jdbc:h2:mem:upload_controller_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.security.oauth2.client.registration.google.client-id=test-client-id",
		"spring.security.oauth2.client.registration.google.client-secret=test-client-secret",
		"supabase.service-role-key=test-service-role-key"
})
class UploadControllerTest {
	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private ImageUploadService imageUploadService;

	@MockitoBean
	private UserService userService;

	@MockitoBean
	private PageService pageService;

	@MockitoBean
	private PageHistoryService pageHistoryService;

	@Test
	void uploadWithoutFileReturnsCleanBadRequest() throws Exception {
		mockMvc.perform(multipart("/api/uploads/images")
						.with(oauth2Login()))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.error").value("Bad Request"))
				.andExpect(jsonPath("$.messages[0]").value("Campo multipart obrigatorio ausente: file"));
	}

	@Test
	void uploadWithoutAuthenticationReturnsJsonUnauthorized() throws Exception {
		MockMultipartFile file = new MockMultipartFile("file", "imagem.png", "image/png", "png".getBytes());

		mockMvc.perform(multipart("/api/uploads/images")
						.file(file))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.error").value("Unauthorized"))
				.andExpect(jsonPath("$.messages[0]").value("Autenticacao obrigatoria."));
	}

	@Test
	void uploadValidImageReturnsResponse() throws Exception {
		User user = user();
		UUID pageId = UUID.randomUUID();
		MockMultipartFile file = new MockMultipartFile("file", "imagem.png", "image/png", "png".getBytes());
		ImageUploadResponse response = new ImageUploadResponse(
				"https://example.supabase.co/storage/v1/object/public/wiki-images/pages/%s/imagem.png".formatted(pageId),
				"![Minha imagem](https://example.supabase.co/storage/v1/object/public/wiki-images/pages/%s/imagem.png)".formatted(pageId),
				"pages/%s/imagem.png".formatted(pageId),
				"image/png",
				file.getSize());

		when(userService.getCurrentUser(any(OAuth2AuthenticationToken.class))).thenReturn(user);
		when(imageUploadService.upload(any(), eq(pageId), eq("Minha imagem"), eq(user))).thenReturn(response);

		mockMvc.perform(multipart("/api/uploads/images")
						.file(file)
						.param("pageId", pageId.toString())
						.param("alt", "Minha imagem")
						.with(oauth2Login()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.contentType").value("image/png"))
				.andExpect(jsonPath("$.path").value("pages/%s/imagem.png".formatted(pageId)))
				.andExpect(jsonPath("$.markdown").value(response.markdown()));
	}

	private User user() {
		User user = User.builder()
				.name("Pedro")
				.email("pedro@example.com")
				.provider(AuthProvider.GOOGLE)
				.providerId("google-id")
				.build();
		user.setId(UUID.randomUUID());
		user.setCreatedAt(LocalDateTime.now());
		user.setUpdatedAt(LocalDateTime.now());
		return user;
	}
}
