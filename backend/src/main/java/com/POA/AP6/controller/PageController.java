package com.POA.AP6.controller;

import com.POA.AP6.dto.PageHistoryResponse;
import com.POA.AP6.dto.PageRequest;
import com.POA.AP6.dto.PageResponse;
import com.POA.AP6.dto.PageSummaryResponse;
import com.POA.AP6.model.User;
import com.POA.AP6.service.PageHistoryService;
import com.POA.AP6.service.PageService;
import com.POA.AP6.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pages")
public class PageController {
	private final PageService pageService;
	private final PageHistoryService pageHistoryService;
	private final UserService userService;

	public PageController(PageService pageService, PageHistoryService pageHistoryService, UserService userService) {
		this.pageService = pageService;
		this.pageHistoryService = pageHistoryService;
		this.userService = userService;
	}

	@GetMapping
	public List<PageSummaryResponse> list() {
		return pageService.listActivePages().stream()
				.map(PageSummaryResponse::from)
				.toList();
	}

	@GetMapping("/search")
	public List<PageSummaryResponse> search(
			@RequestParam(required = false) String q,
			@RequestParam(required = false) Integer limit) {
		return pageService.search(q, limit).stream()
				.map(PageSummaryResponse::from)
				.toList();
	}

	@GetMapping("/{slug}")
	public PageResponse findBySlug(@PathVariable String slug) {
		return PageResponse.from(pageService.findBySlug(slug));
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public PageResponse create(@Valid @RequestBody PageRequest request, OAuth2AuthenticationToken authentication) {
		User author = userService.getCurrentUser(authentication);
		return PageResponse.from(pageService.create(request, author));
	}

	@PutMapping("/{id}")
	public PageResponse update(
			@PathVariable UUID id,
			@Valid @RequestBody PageRequest request,
			OAuth2AuthenticationToken authentication) {
		User editor = userService.getCurrentUser(authentication);
		return PageResponse.from(pageService.update(id, request, editor));
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID id, OAuth2AuthenticationToken authentication) {
		User editor = userService.getCurrentUser(authentication);
		pageService.delete(id, editor);
	}

	@GetMapping("/{id}/history")
	public List<PageHistoryResponse> history(@PathVariable UUID id) {
		return pageHistoryService.listByPage(id).stream()
				.map(PageHistoryResponse::from)
				.toList();
	}

	@GetMapping("/{id}/history/{version}")
	public PageHistoryResponse historyVersion(@PathVariable UUID id, @PathVariable Integer version) {
		return PageHistoryResponse.from(pageHistoryService.findByPageAndVersion(id, version));
	}

	@PostMapping("/{id}/history/{version}/restore")
	public PageResponse restoreVersion(
			@PathVariable UUID id,
			@PathVariable Integer version,
			OAuth2AuthenticationToken authentication) {
		User editor = userService.getCurrentUser(authentication);
		return PageResponse.from(pageService.restoreVersion(id, version, editor));
	}
}
