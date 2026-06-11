package com.POA.AP6.controller;

import com.POA.AP6.dto.CurrentUserResponse;
import com.POA.AP6.service.UserService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {
	private final UserService userService;

	public UserController(UserService userService) {
		this.userService = userService;
	}

	@GetMapping("/me")
	public CurrentUserResponse me(OAuth2AuthenticationToken authentication) {
		return CurrentUserResponse.from(userService.getCurrentUser(authentication));
	}
}
