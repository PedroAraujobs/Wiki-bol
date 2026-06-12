package com.POA.AP6.config;

import com.POA.AP6.service.CustomOAuth2UserService;
import com.POA.AP6.service.CustomOidcUserService;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {
	private static final String DEFAULT_FRONTEND_URL = "http://localhost:5173";

	private final CustomOAuth2UserService customOAuth2UserService;
	private final CustomOidcUserService customOidcUserService;
	private final String frontendUrl;

	public SecurityConfig(
			CustomOAuth2UserService customOAuth2UserService,
			CustomOidcUserService customOidcUserService,
			@Value("${app.frontend-url}") String frontendUrl) {
		this.customOAuth2UserService = customOAuth2UserService;
		this.customOidcUserService = customOidcUserService;
		this.frontendUrl = resolveFrontendRedirectUrl(frontendUrl);
	}

	static String resolveFrontendRedirectUrl(String configuredUrl) {
		if (configuredUrl == null || configuredUrl.isBlank() || configuredUrl.contains("/api/")) {
			return DEFAULT_FRONTEND_URL;
		}

		return configuredUrl;
	}

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		return http
				.csrf(csrf -> csrf.disable())
				.cors(Customizer.withDefaults())
				.authorizeHttpRequests(auth -> auth
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
		configuration.setAllowedOrigins(List.of("http://localhost:3000", "http://localhost:5173"));
		configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
		configuration.setAllowedHeaders(List.of("*"));
		configuration.setAllowCredentials(true);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", configuration);
		return source;
	}
}
