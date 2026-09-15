'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * The reading pane. Wide type, generous leading, and blockquotes styled as
 * cel-shaded callouts so a key takeaway reads as a moment rather than a
 * indented paragraph.
 */
export default function StoryNarrative({ markdown }: { markdown: string }) {
  return (
    <article className="max-w-[68ch] text-[1.05rem] leading-[1.75]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: (props) => (
            <h2
              className="mt-12 font-[family-name:var(--font-display)] text-2xl italic uppercase leading-tight tracking-tight sm:text-3xl"
              {...props}
            />
          ),
          h3: (props) => (
            <h3
              className="mt-9 font-[family-name:var(--font-display)] text-lg italic uppercase tracking-tight"
              {...props}
            />
          ),
          p: (props) => <p className="mt-5" {...props} />,
          ul: (props) => (
            <ul className="mt-5 list-disc space-y-2 pl-6" {...props} />
          ),
          ol: (props) => (
            <ol className="mt-5 list-decimal space-y-2 pl-6" {...props} />
          ),
          strong: (props) => (
            <strong className="font-bold text-[var(--ink)]" {...props} />
          ),
          a: (props) => (
            <a
              className="underline decoration-[var(--accent)] decoration-2 underline-offset-4"
              {...props}
            />
          ),
          code: (props) => (
            <code
              className="border-2 border-[var(--line)] bg-[var(--surface-alt)] px-1.5 py-0.5 font-mono text-[0.85em]"
              {...props}
            />
          ),
          blockquote: (props) => (
            <blockquote
              className="anime-panel my-8 border-l-[6px] p-5 text-lg font-medium italic leading-relaxed"
              {...props}
            />
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
