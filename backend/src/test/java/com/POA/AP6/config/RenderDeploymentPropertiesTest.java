package com.POA.AP6.config;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
		"PORT=10000",
		"spring.datasource.url=jdbc:h2:mem:render_deployment_properties_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.security.oauth2.client.registration.google.client-id=test-client-id",
		"spring.security.oauth2.client.registration.google.client-secret=test-client-secret",
		"supabase.service-role-key=test-service-role-key"
})
class RenderDeploymentPropertiesTest {
	@Autowired
	private Environment environment;

	@Test
	void renderRuntimePropertiesAreConfigured() {
		assertEquals("10000", environment.getProperty("server.port"));
		assertEquals("0.0.0.0", environment.getProperty("server.address"));
		assertEquals("framework", environment.getProperty("server.forward-headers-strategy"));
		assertEquals("none", environment.getProperty("server.servlet.session.cookie.same-site"));
		assertEquals("true", environment.getProperty("server.servlet.session.cookie.secure"));
	}
}
