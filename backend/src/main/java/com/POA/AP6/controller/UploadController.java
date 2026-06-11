package com.POA.AP6.controller;

import com.POA.AP6.dto.ImageUploadResponse;
import com.POA.AP6.model.User;
import com.POA.AP6.service.ImageUploadService;
import com.POA.AP6.service.UserService;
import java.util.UUID;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {
	private final ImageUploadService imageUploadService;
	private final UserService userService;

	public UploadController(ImageUploadService imageUploadService, UserService userService) {
		this.imageUploadService = imageUploadService;
		this.userService = userService;
	}

	@PostMapping("/images")
	public ImageUploadResponse uploadImage(
			@RequestParam("file") MultipartFile file,
			@RequestParam(value = "pageId", required = false) UUID pageId,
			@RequestParam(value = "alt", required = false) String alt,
			OAuth2AuthenticationToken authentication) {
		User user = userService.getCurrentUser(authentication);
		return imageUploadService.upload(file, pageId, alt, user);
	}
}
