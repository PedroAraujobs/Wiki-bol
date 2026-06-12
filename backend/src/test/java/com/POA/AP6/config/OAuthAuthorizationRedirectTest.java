package com.POA.AP6.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.POA.AP6.service.ImageUploadService;
import com.POA.AP6.service.PageHistoryService;
import com.POA.AP6.service.PageService;
import com.POA.AP6.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@Import(OAuthAuthorizationRedirectTest.MockServicesConfig.class)
@ExtendWith(OutputCaptureExtension.class)
@TestPropertySource(properties = {
		"app.frontend-url=https://wiki-bol.testpedrobot.workers.dev",
		"spring.datasource.url=jdbc:h2:mem:oauth-redirect-test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.security.oauth2.client.registration.google.client-id=test-client-id",
		"spring.security.oauth2.client.registration.google.client-secret=test-client-secret",
		"supabase.service-role-key=test-service-role-key"
})
class OAuthAuthorizationRedirectTest {
	@Autowired
	private MockMvc mockMvc;

	@Test
	void googleAuthorizationStartRedirectsToGoogleWithPublicCallback(CapturedOutput output) throws Exception {
		String location = mockMvc
				.perform(get("/oauth2/authorization/google")
						.header("Host", "wiki-bol-api.onrender.com")
						.header("X-Forwarded-Proto", "https")
						.header("X-Forwarded-Host", "wiki-bol-api.onrender.com"))
				.andExpect(status().isFound())
				.andReturn()
				.getResponse()
				.getHeader("Location");

		assertThat(location).startsWith("https://accounts.google.com/o/oauth2/v2/auth?");
		assertThat(location).contains("redirect_uri=https://wiki-bol-api.onrender.com/login/oauth2/code/google");
		assertThat(output).contains("OAuth request started path=/oauth2/authorization/google");
		assertThat(output).contains("OAuth request completed path=/oauth2/authorization/google status=302");
	}

	@Test
	void invalidGoogleCallbackRedirectsToFrontendAndLogsFailure(CapturedOutput output) throws Exception {
		String location = mockMvc
				.perform(get("/login/oauth2/code/google")
						.header("Host", "wiki-bol-api.onrender.com")
						.header("X-Forwarded-Proto", "https")
						.header("X-Forwarded-Host", "wiki-bol-api.onrender.com"))
				.andExpect(status().isFound())
				.andReturn()
				.getResponse()
				.getHeader("Location");

		assertThat(location).isEqualTo("https://wiki-bol.testpedrobot.workers.dev");
		assertThat(output).contains("OAuth login failed path=/login/oauth2/code/google");
		assertThat(output).contains("OAuth request completed path=/login/oauth2/code/google status=302");
	}

	static class MockServicesConfig {
		@Bean
		UserService userService() {
			return mock(UserService.class);
		}

		@Bean
		PageService pageService() {
			return mock(PageService.class);
		}

		@Bean
		PageHistoryService pageHistoryService() {
			return mock(PageHistoryService.class);
		}

		@Bean
		ImageUploadService imageUploadService() {
			return mock(ImageUploadService.class);
		}
	}
}
