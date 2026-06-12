package com.POA.AP6.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

class SecurityConfigTest {
	@Test
	void resolveFrontendUrlFallsBackWhenConfiguredUrlPointsToApi() {
		String redirectUrl = SecurityConfig.resolveFrontendRedirectUrl("http://localhost:8080/api/users/me");

		assertEquals("http://localhost:5173", redirectUrl);
	}

	@Test
	void resolveFrontendUrlKeepsValidFrontendUrl() {
		String redirectUrl = SecurityConfig.resolveFrontendRedirectUrl("http://localhost:5173/pages");

		assertEquals("http://localhost:5173/pages", redirectUrl);
	}

	@Test
	void corsAllowsConfiguredFrontendAndLocalDevelopmentOrigins() {
		SecurityConfig config = new SecurityConfig(
				null,
				null,
				new OAuthRequestLoggingFilter(),
				"https://wiki-bol.testpedrobot.workers.dev");
		UrlBasedCorsConfigurationSource source = (UrlBasedCorsConfigurationSource) config.corsConfigurationSource();
		CorsConfiguration cors = source.getCorsConfigurations().get("/**");

		assertEquals(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"), cors.getAllowedMethods());
		assertEquals(List.of("*"), cors.getAllowedHeaders());
		assertEquals(true, cors.getAllowCredentials());
		assertTrue(cors.getAllowedOrigins().contains("https://wiki-bol.testpedrobot.workers.dev"));
		assertTrue(cors.getAllowedOrigins().contains("http://localhost:5173"));
		assertTrue(cors.getAllowedOrigins().contains("http://localhost:3000"));
	}
}
