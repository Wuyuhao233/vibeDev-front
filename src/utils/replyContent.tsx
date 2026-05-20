import { normalizeImageUrl } from './imageUrl';

const IMAGE_MD_REGEX = /!\[.*?\]\((.*?)\)/g;

/**
 * Extract text and image URLs from contentMarkdown.
 * Markdown images like `![](url)` are stripped from text and collected as URLs.
 */
export function extractReplyContent(markdown: string): {
  text: string;
  images: string[];
} {
  const images: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = IMAGE_MD_REGEX.exec(markdown)) !== null) {
    if (match[1]) images.push(match[1]);
  }
  // Remove image markdown lines, trim blank lines
  const text = markdown
    .replace(IMAGE_MD_REGEX, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { text, images };
}

/**
 * Render a reply content: text as plain text + images as <img> tags below.
 */
export function ReplyContent({ markdown, imageClassName }: { markdown: string; imageClassName?: string }) {
  const { text, images } = extractReplyContent(markdown);
  return (
    <>
      {text && (
        <span className="whitespace-pre-wrap break-words">{text}</span>
      )}
      {images.length > 0 && (
        <div className={`flex flex-wrap gap-2 ${text ? 'mt-2' : ''}`}>
          {images.map((url, i) => (
            <img
              key={i}
              src={normalizeImageUrl(url)}
              alt={`图片 ${i + 1}`}
              className={`rounded-md max-h-60 object-contain ${imageClassName ?? ''}`}
              loading="lazy"
            />
          ))}
        </div>
      )}
    </>
  );
}
