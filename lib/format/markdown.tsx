import React from "react";

// Tiny safe markdown renderer. Supports inline **bold**, *italic*, `code`,
// [link](https://…), and preserves paragraph + single-line breaks. Every
// other character is rendered as plain text — no raw HTML, no images, no
// scripts, no iframes. Designed for comments and AI guide responses.
//
// Why hand-rolled: rendering inputs from random users + an LLM means the
// safe surface area has to be small and explicit. Anything we don't
// recognize is escaped on the React side because we never use
// dangerouslySetInnerHTML.

type Token =
  | { kind: "text"; value: string }
  | { kind: "bold"; children: Token[] }
  | { kind: "italic"; children: Token[] }
  | { kind: "code"; value: string }
  | { kind: "link"; href: string; label: string };

const URL_OK = /^(https?:|mailto:)/i;

export function renderMarkdown(input: string): React.ReactNode {
  if (!input) return null;
  // Split on blank lines into paragraphs.
  const paragraphs = input.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return paragraphs.map((para, i) => (
    <p key={i} className="whitespace-pre-wrap">
      {renderInline(para)}
    </p>
  ));
}

export function renderInline(input: string): React.ReactNode {
  const tokens = tokenize(input);
  return tokens.map((t, i) => renderToken(t, i));
}

function renderToken(t: Token, key: number): React.ReactNode {
  switch (t.kind) {
    case "text":
      return <React.Fragment key={key}>{t.value}</React.Fragment>;
    case "bold":
      return (
        <strong key={key} className="font-medium text-foreground">
          {t.children.map((c, i) => renderToken(c, i))}
        </strong>
      );
    case "italic":
      return (
        <em key={key} className="italic">
          {t.children.map((c, i) => renderToken(c, i))}
        </em>
      );
    case "code":
      return (
        <code
          key={key}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground"
        >
          {t.value}
        </code>
      );
    case "link":
      return URL_OK.test(t.href) ? (
        <a
          key={key}
          href={t.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground underline-offset-2 hover:text-primary hover:underline"
        >
          {t.label}
        </a>
      ) : (
        // Fall back to plain text for unrecognized schemes.
        <React.Fragment key={key}>{t.label}</React.Fragment>
      );
  }
}

// Inline tokenizer. Recognized:
//   `code`      — backtick spans, no nested formatting
//   **bold**    — paired ** with nested inline allowed
//   *italic*    — paired * (skipped if it would collide with **)
//   [label](url)
// Anything else passes through as text.
function tokenize(input: string): Token[] {
  const out: Token[] = [];
  let i = 0;
  let buf = "";
  const flush = () => {
    if (buf.length > 0) {
      out.push({ kind: "text", value: buf });
      buf = "";
    }
  };

  while (i < input.length) {
    const c = input[i];

    if (c === "`") {
      const end = input.indexOf("`", i + 1);
      if (end > i) {
        flush();
        out.push({ kind: "code", value: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    if (c === "*" && input[i + 1] === "*") {
      const end = input.indexOf("**", i + 2);
      if (end > i + 1) {
        flush();
        out.push({ kind: "bold", children: tokenize(input.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }

    if (c === "*") {
      // Single star — pair with the next non-star *.
      let j = i + 1;
      while (j < input.length) {
        if (input[j] === "*" && input[j + 1] !== "*") break;
        j++;
      }
      if (j < input.length) {
        flush();
        out.push({
          kind: "italic",
          children: tokenize(input.slice(i + 1, j)),
        });
        i = j + 1;
        continue;
      }
    }

    if (c === "[") {
      const close = input.indexOf("](", i + 1);
      if (close > i) {
        const labelEnd = close;
        const urlEnd = input.indexOf(")", labelEnd + 2);
        if (urlEnd > labelEnd) {
          flush();
          out.push({
            kind: "link",
            label: input.slice(i + 1, labelEnd),
            href: input.slice(labelEnd + 2, urlEnd),
          });
          i = urlEnd + 1;
          continue;
        }
      }
    }

    buf += c;
    i++;
  }
  flush();
  return out;
}
