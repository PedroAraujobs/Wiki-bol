package com.POA.AP6.strategy;

import java.text.Normalizer;
import org.springframework.stereotype.Component;

@Component
public class DefaultSlugGenerationStrategy implements SlugGenerationStrategy {
	@Override
	public String generateSlug(String title) {
		String normalized = Normalizer.normalize(title, Normalizer.Form.NFD)
				.replaceAll("\\p{M}", "")
				.toLowerCase()
				.replaceAll("[^a-z0-9]+", "-")
				.replaceAll("(^-|-$)", "");

		return normalized.isBlank() ? "pagina" : normalized;
	}
}
