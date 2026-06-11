package com.POA.AP6;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
		"spring.datasource.url=jdbc:h2:mem:ap6_test;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE",
		"spring.datasource.driver-class-name=org.h2.Driver",
		"spring.datasource.username=sa",
		"spring.datasource.password=",
		"spring.jpa.hibernate.ddl-auto=create-drop",
		"spring.security.oauth2.client.registration.google.client-id=test-client-id",
		"spring.security.oauth2.client.registration.google.client-secret=test-client-secret",
		"supabase.service-role-key=test-service-role-key"
})
class Ap6ApplicationTests {

	@Test
	void contextLoads() {
	}

}
