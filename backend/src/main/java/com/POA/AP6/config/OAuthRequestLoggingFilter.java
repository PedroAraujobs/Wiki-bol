package com.POA.AP6.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class OAuthRequestLoggingFilter extends OncePerRequestFilter {
	private static final Logger logger = LoggerFactory.getLogger(OAuthRequestLoggingFilter.class);
	private static final Set<String> OAUTH_PATHS = Set.of(
			"/oauth2/authorization/google",
			"/login/oauth2/code/google");

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		return !OAUTH_PATHS.contains(request.getRequestURI());
	}

	@Override
	protected void doFilterInternal(
			HttpServletRequest request,
			HttpServletResponse response,
			FilterChain filterChain) throws ServletException, IOException {
		long startTime = System.nanoTime();
		String path = request.getRequestURI();

		logger.info(
				"OAuth request started path={} method={} host={} forwardedProto={} hasCode={} hasState={}",
				path,
				request.getMethod(),
				request.getHeader("Host"),
				request.getHeader("X-Forwarded-Proto"),
				request.getParameter("code") != null,
				request.getParameter("state") != null);

		try {
			filterChain.doFilter(request, response);
		} finally {
			long durationMs = (System.nanoTime() - startTime) / 1_000_000;
			logger.info(
					"OAuth request completed path={} status={} durationMs={} location={}",
					path,
					response.getStatus(),
					durationMs,
					sanitizedLocation(response.getHeader("Location")));
		}
	}

	private static String sanitizedLocation(String location) {
		if (location == null) {
			return null;
		}

		return location
				.replaceAll("(?i)([?&]code=)[^&]+", "$1<redacted>")
				.replaceAll("(?i)([?&]state=)[^&]+", "$1<redacted>");
	}
}
