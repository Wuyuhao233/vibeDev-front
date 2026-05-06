export function markdownToPlainText(markdown: string, maxLength = 200): string {
  let text = markdown;
  // Remove images
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');
  // Remove links, keep text
  text = text.replace(/\[([^\]]*)\]\([^)]+\)/g, '$1');
  // Remove headers
  text = text.replace(/^#{1,6}\s+/gm, '');
  // Remove bold/italic
  text = text.replace(/(\*{1,3}|_{1,3})(.*?)\1/g, '$2');
  // Remove strikethrough
  text = text.replace(/~~(.*?)~~/g, '$1');
  // Remove inline code
  text = text.replace(/`([^`]+)`/g, '$1');
  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');
  // Remove blockquotes
  text = text.replace(/^>\s+/gm, '');
  // Remove horizontal rules
  text = text.replace(/^[-*_]{3,}\s*$/gm, '');
  // Remove list markers
  text = text.replace(/^[\s]*[-*+]\s+/gm, '');
  text = text.replace(/^[\s]*\d+\.\s+/gm, '');
  // Collapse whitespace
  text = text.replace(/\n{2,}/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

  if (text.length > maxLength) {
    return text.slice(0, maxLength) + '...';
  }
  return text;
}
