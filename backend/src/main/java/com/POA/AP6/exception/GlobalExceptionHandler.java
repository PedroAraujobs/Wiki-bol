package com.POA.AP6.exception;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

@RestControllerAdvice
public class GlobalExceptionHandler {
	@ExceptionHandler(ResourceNotFoundException.class)
	public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException exception) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(ApiError.of(404, "Not Found", List.of(exception.getMessage())));
	}

	@ExceptionHandler(BusinessRuleException.class)
	public ResponseEntity<ApiError> handleBusinessRule(BusinessRuleException exception) {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(ApiError.of(400, "Bad Request", List.of(exception.getMessage())));
	}

	@ExceptionHandler(ForbiddenException.class)
	public ResponseEntity<ApiError> handleForbidden(ForbiddenException exception) {
		return ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(ApiError.of(403, "Forbidden", List.of(exception.getMessage())));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception) {
		List<String> messages = exception.getBindingResult().getFieldErrors().stream()
				.map(error -> error.getField() + ": " + error.getDefaultMessage())
				.toList();

		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(ApiError.of(400, "Validation Error", messages));
	}

	@ExceptionHandler(MissingServletRequestPartException.class)
	public ResponseEntity<ApiError> handleMissingPart(MissingServletRequestPartException exception) {
		String message = "Campo multipart obrigatorio ausente: " + exception.getRequestPartName();

		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(ApiError.of(400, "Bad Request", List.of(message)));
	}

	@ExceptionHandler(MissingServletRequestParameterException.class)
	public ResponseEntity<ApiError> handleMissingParameter(MissingServletRequestParameterException exception) {
		String message = "Parametro obrigatorio ausente: " + exception.getParameterName();

		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(ApiError.of(400, "Bad Request", List.of(message)));
	}

	@ExceptionHandler(MaxUploadSizeExceededException.class)
	public ResponseEntity<ApiError> handleMaxUploadSize() {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(ApiError.of(400, "Bad Request", List.of("A imagem deve ter no maximo 5MB.")));
	}

	@ExceptionHandler(MultipartException.class)
	public ResponseEntity<ApiError> handleMultipartException() {
		return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(ApiError.of(400, "Bad Request", List.of("Requisicao multipart invalida.")));
	}
}
