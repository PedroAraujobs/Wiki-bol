package com.POA.AP6.service;

import com.POA.AP6.dto.ImageUploadResponse;
import com.POA.AP6.exception.BusinessRuleException;
import com.POA.AP6.exception.ResourceNotFoundException;
import com.POA.AP6.model.Page;
import com.POA.AP6.model.User;
import com.POA.AP6.repository.PageRepository;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ImageUploadService {
	private static final Logger logger = LoggerFactory.getLogger(ImageUploadService.class);
	private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
	private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
			"image/png",
			"image/jpeg",
			"image/webp",
			"image/gif");
	private static final Map<String, String> EXTENSIONS_BY_CONTENT_TYPE = Map.of(
			"image/png", "png",
			"image/jpeg", "jpg",
			"image/webp", "webp",
			"image/gif", "gif");

	private final RestClient restClient;
	private final String supabaseUrl;
	private final String bucket;
	private final String serviceRoleKey;
	private final PageRepository pageRepository;

	@Autowired
	public ImageUploadService(
			@Value("${supabase.url}") String supabaseUrl,
			@Value("${supabase.storage.bucket}") String bucket,
			@Value("${supabase.service-role-key}") String serviceRoleKey,
			PageRepository pageRepository) {
		this(RestClient.builder().build(), supabaseUrl, bucket, serviceRoleKey, pageRepository);
	}

	ImageUploadService(
			RestClient restClient,
			String supabaseUrl,
			String bucket,
			String serviceRoleKey,
			PageRepository pageRepository) {
		this.restClient = restClient;
		this.supabaseUrl = stripTrailingSlash(supabaseUrl);
		this.bucket = bucket;
		this.serviceRoleKey = serviceRoleKey;
		this.pageRepository = pageRepository;
	}

	public ImageUploadResponse upload(MultipartFile file, UUID pageId, String alt, User user) {
		byte[] fileBytes = readFileBytes(file);
		String contentType = validateFile(file, fileBytes);
		validateActivePage(pageId);
		validateServiceRoleKey();

		String extension = EXTENSIONS_BY_CONTENT_TYPE.get(contentType);
		String path = buildPath(pageId, user.getId(), extension);
		String publicUrl = "%s/storage/v1/object/public/%s/%s".formatted(supabaseUrl, bucket, path);

		try {
			restClient.post()
					.uri("%s/storage/v1/object/%s/%s".formatted(supabaseUrl, bucket, encodePath(path)))
					.header(HttpHeaders.AUTHORIZATION, "Bearer " + serviceRoleKey)
					.header("apikey", serviceRoleKey)
					.header("x-upsert", "false")
					.contentType(MediaType.parseMediaType(contentType))
					.body(fileBytes)
					.retrieve()
					.toBodilessEntity();
		} catch (RestClientResponseException exception) {
			logger.warn(
					"Supabase Storage upload failed status={} bucket={} path={} contentType={} size={} responseBody={}",
					exception.getStatusCode().value(),
					bucket,
					path,
					contentType,
					file.getSize(),
					exception.getResponseBodyAsString());
			throw new BusinessRuleException("Falha ao enviar imagem para o Supabase Storage.");
		}

		String markdown = "![%s](%s)".formatted(sanitizeAlt(alt, file.getOriginalFilename()), publicUrl);
		return new ImageUploadResponse(publicUrl, markdown, path, contentType, file.getSize());
	}

	private byte[] readFileBytes(MultipartFile file) {
		try {
			return file == null ? new byte[0] : file.getBytes();
		} catch (IOException exception) {
			throw new BusinessRuleException("Nao foi possivel ler o arquivo enviado.");
		}
	}

	private String validateFile(MultipartFile file, byte[] fileBytes) {
		if (file == null || file.isEmpty()) {
			throw new BusinessRuleException("Envie uma imagem para upload.");
		}

		if (file.getSize() > MAX_FILE_SIZE) {
			throw new BusinessRuleException("A imagem deve ter no maximo 5MB.");
		}

		String contentType = file.getContentType();
		if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
			throw new BusinessRuleException("Formato de imagem nao permitido. Use PNG, JPG, WEBP ou GIF.");
		}

		if (!contentMatchesDeclaredType(fileBytes, contentType)) {
			throw new BusinessRuleException("O conteudo do arquivo nao corresponde ao formato informado.");
		}

		return contentType;
	}

	private void validateServiceRoleKey() {
		if (serviceRoleKey == null || serviceRoleKey.isBlank()) {
			throw new BusinessRuleException("SUPABASE_SERVICE_ROLE_KEY nao configurada no backend.");
		}
	}

	private void validateActivePage(UUID pageId) {
		if (pageId == null) {
			return;
		}

		Page page = pageRepository.findById(pageId)
				.orElseThrow(() -> new ResourceNotFoundException("Pagina nao encontrada."));

		if (page.getDeletedAt() != null) {
			throw new ResourceNotFoundException("Pagina nao encontrada.");
		}
	}

	private boolean contentMatchesDeclaredType(byte[] fileBytes, String contentType) {
		return switch (contentType) {
			case "image/png" -> isPng(fileBytes);
			case "image/jpeg" -> isJpeg(fileBytes);
			case "image/webp" -> isWebp(fileBytes);
			case "image/gif" -> isGif(fileBytes);
			default -> false;
		};
	}

	private boolean isPng(byte[] fileBytes) {
		byte[] signature = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
		return startsWith(fileBytes, signature);
	}

	private boolean isJpeg(byte[] fileBytes) {
		return fileBytes.length >= 3
				&& (fileBytes[0] & 0xFF) == 0xFF
				&& (fileBytes[1] & 0xFF) == 0xD8
				&& (fileBytes[2] & 0xFF) == 0xFF;
	}

	private boolean isGif(byte[] fileBytes) {
		return startsWith(fileBytes, "GIF87a".getBytes(StandardCharsets.US_ASCII))
				|| startsWith(fileBytes, "GIF89a".getBytes(StandardCharsets.US_ASCII));
	}

	private boolean isWebp(byte[] fileBytes) {
		return fileBytes.length >= 12
				&& matchesAt(fileBytes, 0, "RIFF".getBytes(StandardCharsets.US_ASCII))
				&& matchesAt(fileBytes, 8, "WEBP".getBytes(StandardCharsets.US_ASCII));
	}

	private boolean startsWith(byte[] fileBytes, byte[] signature) {
		return matchesAt(fileBytes, 0, signature);
	}

	private boolean matchesAt(byte[] fileBytes, int offset, byte[] signature) {
		if (fileBytes.length < offset + signature.length) {
			return false;
		}

		for (int index = 0; index < signature.length; index++) {
			if (fileBytes[offset + index] != signature[index]) {
				return false;
			}
		}

		return true;
	}

	private String buildPath(UUID pageId, UUID userId, String extension) {
		String filename = UUID.randomUUID() + "." + extension;

		if (pageId != null) {
			return "pages/%s/%s".formatted(pageId, filename);
		}

		return "uploads/%s/%s".formatted(userId, filename);
	}

	private String encodePath(String path) {
		return String.join("/", Arrays.stream(path.split("/"))
				.map(segment -> URLEncoder.encode(segment, StandardCharsets.UTF_8).replace("+", "%20"))
				.toList());
	}

	private String sanitizeAlt(String alt, String fallback) {
		String value = alt == null || alt.isBlank() ? fallback : alt;
		if (value == null || value.isBlank()) {
			return "imagem";
		}

		return value.replace("[", "")
				.replace("]", "")
				.replace("(", "")
				.replace(")", "")
				.trim();
	}

	private static String stripTrailingSlash(String value) {
		if (value.endsWith("/")) {
			return value.substring(0, value.length() - 1);
		}
		return value;
	}
}
