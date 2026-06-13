package com.POA.AP6.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

import com.POA.AP6.dto.ImageUploadResponse;
import com.POA.AP6.exception.BusinessRuleException;
import com.POA.AP6.exception.ResourceNotFoundException;
import com.POA.AP6.model.AuthProvider;
import com.POA.AP6.model.Page;
import com.POA.AP6.model.User;
import com.POA.AP6.repository.PageRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

@ExtendWith({MockitoExtension.class, OutputCaptureExtension.class})
class ImageUploadServiceTest {
	@Mock
	private PageRepository pageRepository;

	private MockRestServiceServer server;
	private ImageUploadService imageUploadService;
	private User user;

	@BeforeEach
	void setUp() {
		RestClient.Builder builder = RestClient.builder();
		server = MockRestServiceServer.bindTo(builder).build();
		imageUploadService = new ImageUploadService(
				builder.build(),
				"https://example.supabase.co",
				"wiki-images",
				"test-service-role-key",
				pageRepository);
		user = user();
	}

	@Test
	void uploadRejectsEmptyFile() {
		MockMultipartFile file = new MockMultipartFile("file", "empty.png", "image/png", new byte[0]);

		assertThrows(BusinessRuleException.class, () -> imageUploadService.upload(file, null, null, user));
	}

	@Test
	void uploadRejectsInvalidMimeType() {
		MockMultipartFile file = new MockMultipartFile("file", "text.txt", "text/plain", "texto".getBytes());

		assertThrows(BusinessRuleException.class, () -> imageUploadService.upload(file, null, null, user));
	}

	@Test
	void uploadRejectsFileBiggerThanFiveMb() {
		byte[] content = new byte[(5 * 1024 * 1024) + 1];
		MockMultipartFile file = new MockMultipartFile("file", "big.png", "image/png", content);

		assertThrows(BusinessRuleException.class, () -> imageUploadService.upload(file, null, null, user));
	}

	@Test
	void uploadReturnsPublicUrlAndMarkdownForValidImage() {
		MockMultipartFile file = new MockMultipartFile("file", "imagem.png", "image/png", pngBytes());
		server.expect(requestTo(startsWith("https://example.supabase.co/storage/v1/object/wiki-images/uploads/" + user.getId() + "/")))
				.andExpect(method(HttpMethod.POST))
				.andExpect(header("apikey", "test-service-role-key"))
				.andRespond(withSuccess());

		ImageUploadResponse response = imageUploadService.upload(file, null, "Minha imagem", user);

		assertEquals("image/png", response.contentType());
		assertEquals(file.getSize(), response.size());
		assertEquals("![Minha imagem](" + response.url() + ")", response.markdown());
		server.verify();
	}

	@Test
	void uploadLogsSupabaseFailureWithoutLeakingServiceRoleKey(CapturedOutput output) {
		MockMultipartFile file = new MockMultipartFile("file", "imagem.png", "image/png", pngBytes());
		server.expect(requestTo(startsWith("https://example.supabase.co/storage/v1/object/wiki-images/uploads/" + user.getId() + "/")))
				.andExpect(method(HttpMethod.POST))
				.andRespond(withStatus(HttpStatus.FORBIDDEN).body("{\"message\":\"invalid signature\"}"));

		BusinessRuleException exception = assertThrows(
				BusinessRuleException.class,
				() -> imageUploadService.upload(file, null, "Minha imagem", user));

		assertEquals("Falha ao enviar imagem para o Supabase Storage.", exception.getMessage());
		assertThat(output).contains("Supabase Storage upload failed status=403");
		assertThat(output).contains("bucket=wiki-images");
		assertThat(output).contains("contentType=image/png");
		assertThat(output).contains("size=8");
		assertThat(output).contains("responseBody={\"message\":\"invalid signature\"}");
		assertThat(output).doesNotContain("test-service-role-key");
		server.verify();
	}

	@Test
	void uploadAcceptsValidJpegImage() {
		assertValidImageUpload("imagem.jpg", "image/jpeg", new byte[] {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF});
	}

	@Test
	void uploadAcceptsValidGifImage() {
		assertValidImageUpload("imagem.gif", "image/gif", "GIF89a".getBytes());
	}

	@Test
	void uploadAcceptsValidWebpImage() {
		assertValidImageUpload("imagem.webp", "image/webp", "RIFFxxxxWEBP".getBytes());
	}

	@Test
	void uploadRejectsAllowedMimeTypeWithInvalidBytes() {
		MockMultipartFile file = new MockMultipartFile("file", "fake.png", "image/png", "not-image".getBytes());

		assertThrows(BusinessRuleException.class, () -> imageUploadService.upload(file, null, null, user));
	}

	@Test
	void uploadWithActivePageIdUsesPagePath() {
		UUID pageId = UUID.randomUUID();
		when(pageRepository.findById(pageId)).thenReturn(Optional.of(activePage(pageId)));
		MockMultipartFile file = new MockMultipartFile("file", "imagem.png", "image/png", pngBytes());
		server.expect(requestTo(startsWith("https://example.supabase.co/storage/v1/object/wiki-images/pages/" + pageId + "/")))
				.andExpect(method(HttpMethod.POST))
				.andRespond(withSuccess());

		ImageUploadResponse response = imageUploadService.upload(file, pageId, null, user);

		assertTrue(response.path().startsWith("pages/" + pageId + "/"));
		server.verify();
	}

	@Test
	void uploadWithMissingPageIdThrowsNotFound() {
		UUID pageId = UUID.randomUUID();
		when(pageRepository.findById(pageId)).thenReturn(Optional.empty());
		MockMultipartFile file = new MockMultipartFile("file", "imagem.png", "image/png", pngBytes());

		assertThrows(ResourceNotFoundException.class, () -> imageUploadService.upload(file, pageId, null, user));
	}

	@Test
	void uploadWithDeletedPageIdThrowsNotFound() {
		UUID pageId = UUID.randomUUID();
		Page page = activePage(pageId);
		page.setDeletedAt(LocalDateTime.now());
		when(pageRepository.findById(pageId)).thenReturn(Optional.of(page));
		MockMultipartFile file = new MockMultipartFile("file", "imagem.png", "image/png", pngBytes());

		assertThrows(ResourceNotFoundException.class, () -> imageUploadService.upload(file, pageId, null, user));
	}

	private byte[] pngBytes() {
		return new byte[] {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
	}

	private void assertValidImageUpload(String filename, String contentType, byte[] bytes) {
		MockMultipartFile file = new MockMultipartFile("file", filename, contentType, bytes);
		server.expect(requestTo(startsWith("https://example.supabase.co/storage/v1/object/wiki-images/uploads/" + user.getId() + "/")))
				.andExpect(method(HttpMethod.POST))
				.andRespond(withSuccess());

		ImageUploadResponse response = imageUploadService.upload(file, null, null, user);

		assertEquals(contentType, response.contentType());
		server.verify();
	}

	private Page activePage(UUID pageId) {
		Page page = Page.builder()
				.title("Pagina")
				.slug("pagina")
				.content("Conteudo")
				.currentVersion(1)
				.build();
		page.setId(pageId);
		return page;
	}

	private User user() {
		User user = User.builder()
				.name("Pedro")
				.email("pedro@example.com")
				.provider(AuthProvider.GOOGLE)
				.providerId("google-id")
				.build();
		user.setId(UUID.randomUUID());
		return user;
	}
}
