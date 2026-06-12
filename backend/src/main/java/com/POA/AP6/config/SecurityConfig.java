package com.POA.AP6.config;

import com.POA.AP6.service.CustomOAuth2UserService;
import com.POA.AP6.service.CustomOidcUserService;
import java.net.URI;
import java.net.URISyntaxException;
import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestRedirectFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {
	private static final String DEFAULT_FRONTEND_URL = "http://localhost:5173";

	private final CustomOAuth2UserService customOAuth2UserService;
	private final CustomOidcUserService customOidcUserService;
	private final OAuthRequestLoggingFilter oauthRequestLoggingFilter;
	private final String frontendUrl;

	public SecurityConfig(
			CustomOAuth2UserService customOAuth2UserService,
			CustomOidcUserService customOidcUserService,
			OAuthRequestLoggingFilter oauthRequestLoggingFilter,
			@Value("${app.frontend-url}") String frontendUrl) {
		this.customOAuth2UserService = customOAuth2UserService;
		this.customOidcUserService = customOidcUserService;
		this.oauthRequestLoggingFilter = oauthRequestLoggingFilter;
		this.frontendUrl = resolveFrontendRedirectUrl(frontendUrl);
	}

	static String resolveFrontendRedirectUrl(String configuredUrl) {
		if (configuredUrl == null || configuredUrl.isBlank() || configuredUrl.contains("/api/")) {
			return DEFAULT_FRONTEND_URL;
		}

		return configuredUrl;
	}

	static List<String> allowedCorsOrigins(String configuredFrontendUrl) {
		Set<String> origins = new LinkedHashSet<>();
		origins.add("http://localhost:3000");
		origins.add("http://localhost:5173");
		origins.add(resolveOrigin(resolveFrontendRedirectUrl(configuredFrontendUrl)));
		return origins.stream().filter(origin -> origin != null && !origin.isBlank()).toList();
	}

	private static String resolveOrigin(String url) {
		try {
			URI uri = new URI(url);
			if (uri.getScheme() == null || uri.getHost() == null) {
				return url;
			}

			int port = uri.getPort();
			return port > -1
					? "%s://%s:%d".formatted(uri.getScheme(), uri.getHost(), port)
					: "%s://%s".formatted(uri.getScheme(), uri.getHost());
		} catch (URISyntaxException exception) {
			return url;
		}
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		return http
				.csrf(csrf -> csrf.disable())
				.cors(Customizer.withDefaults())
				.addFilterBefore(oauthRequestLoggingFilter, OAuth2AuthorizationRequestRedirectFilter.class)
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(HttpMethod.GET, "/api/health").permitAll()
						.requestMatchers(HttpMethod.GET, "/api/pages", "/api/pages/**").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/auth/logout").permitAll()
						.requestMatchers("/", "/error").permitAll()
						.anyRequest().authenticated())
				.exceptionHandling(exception -> exception
						.authenticationEntryPoint((request, response, authException) -> {
							if (request.getRequestURI().startsWith("/api/")) {
								response.setStatus(401);
								response.setContentType(MediaType.APPLICATION_JSON_VALUE);
								response.getWriter().write("""
										{"timestamp":"%s","status":401,"error":"Unauthorized","messages":["Autenticacao obrigatoria."]}"""
										.formatted(LocalDateTime.now()));
								return;
							}

							response.sendRedirect("/oauth2/authorization/google");
						}))
				.oauth2Login(oauth -> oauth
						.successHandler((request, response, authentication) -> response.sendRedirect(frontendUrl))
						.userInfoEndpoint(userInfo -> userInfo
								.userService(customOAuth2UserService)
								.oidcUserService(customOidcUserService)))
				.logout(logout -> logout.logoutSuccessUrl("/"))
				.build();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration configuration = new CorsConfiguration();
		configuration.setAllowedOrigins(allowedCorsOrigins(frontendUrl));
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("*"));
		configuration.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
}
