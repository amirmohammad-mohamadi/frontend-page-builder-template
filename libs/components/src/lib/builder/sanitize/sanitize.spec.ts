import { sanitizeBuilderTree } from "./sanitize-builder-tree";
import { sanitizeCss } from "./sanitize-css";
import { PLAIN_CONTENT_TAGS, safeUrl, sanitizeHtml } from "./sanitize-html";

describe("sanitizeHtml", () => {
  it("keeps the rich-text tags and drops everything else", () => {
    expect(sanitizeHtml("<p>Hi <strong>there</strong> <em>you</em><br></p>")).toBe(
      "<p>Hi <strong>there</strong> <em>you</em><br></p>"
    );
    expect(sanitizeHtml("<h1>Title</h1><p>Body</p>")).toBe("Title<p>Body</p>");
    expect(sanitizeHtml("<h1>Title</h1>", PLAIN_CONTENT_TAGS)).toBe("<h1>Title</h1>");
  });

  it("removes scripts with their content and event handlers", () => {
    expect(sanitizeHtml('<p onclick="x()">Hi</p><script>alert(1)</script>')).toBe("<p>Hi</p>");
    expect(sanitizeHtml('<img src=x onerror="alert(1)">')).toBe("");
    expect(sanitizeHtml("<style>body{}</style>Text")).toBe("Text");
  });

  it("neutralises javascript: links and hardens new-tab links", () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).toBe("<a>x</a>");
    expect(sanitizeHtml('<a href="JAVA&#13;SCRIPT:alert(1)">x</a>')).toBe("<a>x</a>");
    expect(sanitizeHtml('<a href="https://example.com" target="_blank">x</a>')).toBe(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">x</a>'
    );
    expect(sanitizeHtml('<a href="/about" title="t">x</a>')).toBe(
      '<a href="/about" title="t">x</a>'
    );
  });

  it("balances tags and escapes stray delimiters", () => {
    expect(sanitizeHtml("<p>Open <strong>bold")).toBe("<p>Open <strong>bold</strong></p>");
    expect(sanitizeHtml("a </em> b")).toBe("a  b");
    expect(sanitizeHtml("1 < 2 and 3 > 2")).toBe("1 &lt; 2 and 3 &gt; 2");
    expect(sanitizeHtml("<!-- hidden --><p>x</p>")).toBe("<p>x</p>");
  });

  it("gives an empty string for non-text input", () => {
    expect(sanitizeHtml(undefined)).toBe("");
    expect(sanitizeHtml(12)).toBe("");
  });
});

describe("safeUrl", () => {
  it("passes web, mail, phone, relative and anchor URLs", () => {
    for (const url of [
      "https://example.com/a?b=c",
      "mailto:a@b.c",
      "tel:+1",
      "/x",
      "#top",
      "page",
      "?q=1",
    ]) {
      expect(safeUrl(url)).toBe(url);
    }
  });

  it("refuses script schemes, even obfuscated", () => {
    expect(safeUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeUrl("  java\tscript:alert(1)")).toBeUndefined();
    expect(safeUrl("vbscript:x")).toBeUndefined();
    expect(safeUrl("data:text/html,<script>")).toBeUndefined();
    expect(safeUrl("")).toBeUndefined();
  });
});

describe("sanitizeBuilderTree", () => {
  it("cleans content, handlers and URLs on every node without mutating the input", () => {
    const tree = {
      type: "section",
      attributes: { onclick: "x()", id: "s1" },
      components: [
        {
          tagName: "a",
          attributes: { href: "javascript:alert(1)", title: "t" },
          content: "<b>x</b><script>1</script>",
        },
        { type: "textnode", content: "<keep as text>" },
      ],
    };
    const copy = JSON.parse(JSON.stringify(tree));
    const clean = sanitizeBuilderTree(tree);

    expect(tree).toEqual(copy);
    expect(clean.attributes).toEqual({ id: "s1" });
    const [link, text] = clean.components as typeof tree.components;
    expect(link.attributes).toEqual({ href: "#", title: "t" });
    expect(link.content).toBe("<b>x</b>");
    expect(text.content).toBe("<keep as text>");
  });

  it("returns falsy input as is", () => {
    expect(sanitizeBuilderTree(null)).toBeNull();
    expect(sanitizeBuilderTree(undefined)).toBeUndefined();
  });
});

describe("sanitizeCss", () => {
  it("removes tag delimiters so a style breakout is impossible", () => {
    const out = sanitizeCss("body{}</style><script>alert(1)</script>");
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
  });

  it("strips @import, expression() and behavior", () => {
    expect(sanitizeCss('@import url("https://evil/x.css"); p{color:red}')).toBe(" p{color:red}");
    expect(sanitizeCss("p{width:expression(alert(1))}")).toBe("p{width:void(alert(1))}");
    expect(sanitizeCss("p{behavior:url(x.htc)}")).toBe("p{/*behavior*/:url(x.htc)}");
  });

  it("neutralises dangerous url() targets and keeps images", () => {
    expect(sanitizeCss("p{background:url(javascript:alert(1))}")).toBe("p{background:url()}");
    expect(sanitizeCss('p{background:url("data:text/html,x")}')).toBe("p{background:url()}");
    expect(sanitizeCss("p{background:url(data:image/png;base64,AAA)}")).toBe(
      "p{background:url(data:image/png;base64,AAA)}"
    );
    expect(sanitizeCss("p{background:url(/img/a.png)}")).toBe("p{background:url(/img/a.png)}");
  });

  it("gives an empty string for empty input", () => {
    expect(sanitizeCss(undefined)).toBe("");
    expect(sanitizeCss("")).toBe("");
  });
});
