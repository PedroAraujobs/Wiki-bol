package com.POA.AP6.config;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

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
}
