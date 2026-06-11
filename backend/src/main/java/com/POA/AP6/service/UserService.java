package com.POA.AP6.service;

import com.POA.AP6.exception.ResourceNotFoundException;
import com.POA.AP6.model.AuthProvider;
import com.POA.AP6.model.User;
import com.POA.AP6.model.UserRole;
import com.POA.AP6.repository.UserRepository;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
	private final UserRepository userRepository;

	public UserService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@Transactional
	public User createOrUpdateFromGoogle(OAuth2User oauth2User) {
		String providerId = oauth2User.getAttribute("sub");
		String email = oauth2User.getAttribute("email");
		String name = oauth2User.getAttribute("name");
		String avatarUrl = oauth2User.getAttribute("picture");

		User user = userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, providerId)
				.or(() -> userRepository.findByEmail(email))
				.orElseGet(User::new);

		user.setProvider(AuthProvider.GOOGLE);
		user.setProviderId(providerId);
		user.setEmail(email);
		user.setName(name);
		user.setAvatarUrl(avatarUrl);
		if (user.getRole() == null) {
			user.setRole(UserRole.USER);
		}

		return userRepository.save(user);
	}

	@Transactional(readOnly = true)
	public User getCurrentUser(OAuth2AuthenticationToken authentication) {
		if (authentication == null || !authentication.isAuthenticated()) {
			throw new ResourceNotFoundException("Usuario autenticado nao encontrado.");
		}

		String providerId = authentication.getPrincipal().getAttribute("sub");
		return userRepository.findByProviderAndProviderId(AuthProvider.GOOGLE, providerId)
				.orElseThrow(() -> new ResourceNotFoundException("Usuario autenticado nao encontrado no banco."));
	}
}
