package com.POA.AP6.controller;

import com.POA.AP6.dto.MessageResponse;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
	@PostMapping("/logout")
	public MessageResponse logout(HttpSession session, HttpServletResponse response) {
		if (session != null) {
			session.invalidate();
		}

		SecurityContextHolder.clearContext();

		Cookie cookie = new Cookie("JSESSIONID", "");
		cookie.setHttpOnly(true);
		cookie.setPath("/");
		cookie.setMaxAge(0);
		response.addCookie(cookie);

		return new MessageResponse("Logout realizado com sucesso.");
	}
}
