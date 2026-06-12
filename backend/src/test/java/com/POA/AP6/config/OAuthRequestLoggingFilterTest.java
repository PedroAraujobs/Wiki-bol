package com.POA.AP6.config;

import static org.assertj.core.api.Assertions.assertThat;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

@ExtendWith(OutputCaptureExtension.class)
class OAuthRequestLoggingFilterTest {
	private final OAuthRequestLoggingFilter filter = new OAuthRequestLoggingFilter();

	@Test
	void logsOAuthCallbackWithoutSensitiveParameters(CapturedOutput output) throws Exception {
		MockHttpServletRequest request = new MockHttpServletRequest("GET", "/login/oauth2/code/google");
		request.addHeader("Host", "wiki-bol-api.onrender.com");
		request.addHeader("X-Forwarded-Proto", "https");
		request.setParameter("code", "secret-code");
		request.setParameter("state", "secret-state");
		MockHttpServletResponse response = new MockHttpServletResponse();
		FilterChain chain = (servletRequest, servletResponse) -> ((MockHttpServletResponse) servletResponse)
				.setHeader("Location", "/pages?code=secret-code&state=secret-state");

		filter.doFilter(request, response, chain);

		assertThat(output).contains("OAuth request started path=/login/oauth2/code/google");
		assertThat(output).contains("hasCode=true");
		assertThat(output).contains("hasState=true");
		assertThat(output).contains("OAuth request completed path=/login/oauth2/code/google");
		assertThat(output).contains("code=<redacted>");
		assertThat(output).contains("state=<redacted>");
		assertThat(output).doesNotContain("secret-code");
		assertThat(output).doesNotContain("secret-state");
	}
}
