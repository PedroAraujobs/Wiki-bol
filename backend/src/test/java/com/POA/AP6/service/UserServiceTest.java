package com.POA.AP6.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.POA.AP6.model.AuthProvider;
import com.POA.AP6.model.User;
import com.POA.AP6.model.UserRole;
import com.POA.AP6.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.core.user.OAuth2User;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {
	@Mock
	private UserRepository userRepository;

	private UserService userService;

	@BeforeEach
	void setUp() {
		userService = new UserService(userRepository);
	}

	@Test
	void createOrUpdateFromGoogleSetsNewUserAsUser() {
		OAuth2User oauth2User = oauth2User();
		when(userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, "google-id")).thenReturn(Optional.empty());
		when(userRepository.findByEmail("pedro@example.com")).thenReturn(Optional.empty());
		when(userRepository.save(org.mockito.ArgumentMatchers.any(User.class)))
				.thenAnswer(invocation -> invocation.getArgument(0));

		User user = userService.createOrUpdateFromGoogle(oauth2User);

		assertEquals(UserRole.USER, user.getRole());
	}

	@Test
	void createOrUpdateFromGoogleKeepsExistingAdminRole() {
		OAuth2User oauth2User = oauth2User();
		User existingUser = User.builder()
				.email("pedro@example.com")
				.provider(AuthProvider.GOOGLE)
				.providerId("google-id")
				.role(UserRole.ADMIN)
				.build();
		when(userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, "google-id"))
				.thenReturn(Optional.of(existingUser));
		when(userRepository.save(existingUser)).thenReturn(existingUser);

		User user = userService.createOrUpdateFromGoogle(oauth2User);

		assertEquals(UserRole.ADMIN, user.getRole());
	}

	private OAuth2User oauth2User() {
		OAuth2User oauth2User = mock(OAuth2User.class);
		when(oauth2User.getAttribute("sub")).thenReturn("google-id");
		when(oauth2User.getAttribute("email")).thenReturn("pedro@example.com");
		when(oauth2User.getAttribute("name")).thenReturn("Pedro");
		when(oauth2User.getAttribute("picture")).thenReturn("https://example.com/avatar.png");
		return oauth2User;
	}
}
