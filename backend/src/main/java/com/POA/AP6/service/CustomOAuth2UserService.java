package com.POA.AP6.service;

import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Service
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {
	private final DefaultOAuth2UserService delegate = new DefaultOAuth2UserService();
	private final UserService userService;

	public CustomOAuth2UserService(UserService userService) {
		this.userService = userService;
	}

	@Override
	public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
		OAuth2User oauth2User = delegate.loadUser(userRequest);

		if ("google".equals(userRequest.getClientRegistration().getRegistrationId())) {
			userService.createOrUpdateFromGoogle(oauth2User);
		}

		return oauth2User;
	}
}
