package com.POA.AP6.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.POA.AP6.model.AuthProvider;
import com.POA.AP6.model.User;
import com.POA.AP6.model.UserRole;
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
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
		"spring.datasource.url=jdbc:h2:mem:user_controller_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.security.oauth2.client.registration.google.client-id=test-client-id",
		"spring.security.oauth2.client.registration.google.client-secret=test-client-secret",
		"supabase.service-role-key=test-service-role-key"
})
class UserControllerTest {
	@Autowired
	private MockMvc mockMvc;

	@MockitoBean
	private UserService userService;

	@MockitoBean
	private PageService pageService;

	@MockitoBean
	private PageHistoryService pageHistoryService;

	@MockitoBean
	private ImageUploadService imageUploadService;

	@Test
	void meReturnsAuthenticatedUserRole() throws Exception {
		User user = user();
		when(userService.getCurrentUser(any(OAuth2AuthenticationToken.class))).thenReturn(user);

		mockMvc.perform(get("/api/users/me")
						.with(oauth2Login()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.email").value("pedro@example.com"))
				.andExpect(jsonPath("$.role").value("ADMIN"));
	}

	private User user() {
		User user = User.builder()
				.name("Pedro")
				.email("pedro@example.com")
				.provider(AuthProvider.GOOGLE)
				.providerId("google-id")
				.role(UserRole.ADMIN)
				.build();
		user.setId(UUID.randomUUID());
		user.setCreatedAt(LocalDateTime.now());
		user.setUpdatedAt(LocalDateTime.now());
		return user;
	}
}
