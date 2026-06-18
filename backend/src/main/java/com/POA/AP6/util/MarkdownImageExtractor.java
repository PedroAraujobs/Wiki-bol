package com.POA.AP6.util;

import java.util.Optional;
import org.commonmark.node.AbstractVisitor;
import org.commonmark.node.Code;
import org.commonmark.node.Image;
import org.commonmark.node.Node;
import org.commonmark.node.Text;
import org.commonmark.parser.Parser;

public final class MarkdownImageExtractor {
	private MarkdownImageExtractor() {
	}

	public static Optional<MarkdownImage> findFirst(String markdown) {
		if (markdown == null || markdown.isBlank()) {
			return Optional.empty();
		}

		FirstImageVisitor visitor = new FirstImageVisitor();
		Parser.builder().build().parse(markdown).accept(visitor);
		return Optional.ofNullable(visitor.firstImage);
	}

	private static String extractAltText(Image image) {
		StringBuilder alt = new StringBuilder();
		appendText(image, alt);
		return alt.toString().trim();
	}

	private static void appendText(Node parent, StringBuilder output) {
		for (Node child = parent.getFirstChild(); child != null; child = child.getNext()) {
			if (child instanceof Text text) {
				output.append(text.getLiteral());
			} else if (child instanceof Code code) {
				output.append(code.getLiteral());
			} else {
				appendText(child, output);
			}
		}
	}

	private static final class FirstImageVisitor extends AbstractVisitor {
		private MarkdownImage firstImage;

		@Override
		public void visit(Image image) {
			if (firstImage == null) {
				firstImage = new MarkdownImage(image.getDestination(), extractAltText(image));
			}
		}
	}

	public record MarkdownImage(String url, String alt) {
	}
}
