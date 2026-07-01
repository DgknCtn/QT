import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders markdown with the app's typography. Used for lesson content. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown-body text-sm text-secondary" style={{ lineHeight: 1.7 }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
