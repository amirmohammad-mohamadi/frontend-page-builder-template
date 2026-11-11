import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentJSON } from "./component-json";
import { renderComponent, renderPageContent } from "./render-component";

const SEED: ComponentJSON = {
  type: "section",
  attributes: { id: "intro", background: "muted", padding: "lg" },
  components: [
    {
      type: "heading",
      attributes: { text: '{"en":"Welcome","fa":"خوش آمدید"}', level: "1", align: "center" },
    },
    {
      type: "text",
      attributes: {
        html: '{"en":"<p>Hello <strong>world</strong><script>alert(1)</script></p>","fa":"<p>سلام <strong>دنیا</strong></p>"}',
      },
    },
    {
      type: "button",
      attributes: {
        label: '{"en":"Start","fa":"شروع"}',
        href: "/start",
        variant: "outline",
        external: "true",
      },
    },
  ],
};

function render(node: ComponentJSON, locale = "en"): string {
  return renderToStaticMarkup(<>{renderComponent(node, { locale, defaultLocale: "en" })}</>);
}

describe("renderComponent", () => {
  it("renders the seed section with a heading, a text and a button", () => {
    const html = render(SEED);
    expect(html).toContain('<section id="intro" class="');
    expect(html).toContain("bg-muted");
    expect(html).toContain("py-20");
    expect(html).toContain('<h1 class="');
    expect(html).toContain("text-center");
    expect(html).toContain(">Welcome</h1>");
    expect(html).toContain("<p>Hello <strong>world</strong></p>");
    expect(html).not.toContain("<script");
    expect(html).toContain('href="/start"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain(">Start</a>");
  });

  it("resolves every translatable text for the requested locale", () => {
    const html = render(SEED, "fa");
    expect(html).toContain(">خوش آمدید</h1>");
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("<p>سلام <strong>دنیا</strong></p>");
    expect(html).toContain(">شروع</a>");
  });

  it("falls back to the default locale when a translation is missing", () => {
    const html = render({ type: "heading", attributes: { text: '{"en":"Only English"}' } }, "fa");
    expect(html).toContain(">Only English</h2>");
  });

  it("renders plain nodes with a safe tag, classes and an attribute allow-list", () => {
    const html = render({
      tagName: "script",
      classes: ["a", { name: "b" }],
      attributes: { onclick: "x()", "data-x": "1", title: "t", href: "javascript:alert(1)" },
      components: [{ type: "textnode", content: "Hi <there>" }],
    });
    expect(html).toBe('<div class="a b" data-x="1" title="t">Hi &lt;there&gt;</div>');
  });

  it("renders a plain node's HTML content sanitized and respects void tags", () => {
    expect(render({ type: "default", content: "<p>x</p><img src=x onerror=y>" })).toBe(
      "<div><p>x</p></div>"
    );
    // `text` is a registered block here; with another registry a core text node is plain.
    expect(render({ type: "text", content: "<em>x</em>" })).toContain("Write your text");
    expect(
      renderToStaticMarkup(
        <>
          {renderComponent({ type: "text", content: "<em>x</em>" }, { locale: "en", blocks: {} })}
        </>
      )
    ).toBe("<div><em>x</em></div>");
    expect(render({ tagName: "hr", components: [{ type: "textnode", content: "ignored" }] })).toBe(
      "<hr/>"
    );
    expect(
      render({ tagName: "a", attributes: { href: "/x", target: "_blank" }, content: "go" })
    ).toBe('<a href="/x" target="_blank" rel="noopener noreferrer">go</a>');
  });

  it("renders nested blocks: an FAQ with items", () => {
    const html = render({
      type: "faq",
      attributes: { title: "Questions" },
      components: [
        { type: "faq-item", attributes: { id: "q1", question: "Why?", answer: "Because." } },
        { type: "faq-item", attributes: { id: "q2", question: "How?", answer: "Like this." } },
      ],
    });
    expect(html).toContain(">Questions</h2>");
    expect(html).toContain('data-slot="accordion"');
    expect((html.match(/data-slot="accordion-item"/g) ?? []).length).toBe(2);
    expect(html).toContain("Why?");
    expect(html).toContain("How?");
  });

  it("renders nothing for comments, null and empty textnodes", () => {
    expect(render({ type: "comment", content: "x" })).toBe("");
    expect(renderComponent(null, { locale: "en" })).toBeNull();
  });
});

describe("renderPageContent", () => {
  it("emits the sanitized CSS and the sanitized sections", () => {
    const html = renderToStaticMarkup(
      <>
        {renderPageContent(
          {
            components: [SEED, { type: "spacer", attributes: { size: "sm", onclick: "x()" } }],
            css: "#intro{color:red}</style><script>alert(1)</script>",
          },
          { locale: "en" }
        )}
      </>
    );
    expect(html.startsWith("<style>#intro{color:red}/style")).toBe(true);
    expect(html).not.toContain("<script");
    expect(html).toContain(">Welcome</h1>");
    expect(html).toContain("h-8");
  });

  it("compiles stored rules when no css string is saved", () => {
    const html = renderToStaticMarkup(
      <>
        {renderPageContent(
          {
            components: [],
            styles: [
              { selectors: [{ name: "intro", type: 2 }], style: { color: "red", margin: "" } },
              {
                selectors: ["wide"],
                state: "hover",
                mediaText: "(min-width: 768px)",
                style: { padding: "1rem" },
              },
              { selectors: [], style: { color: "blue" } },
            ],
          },
          { locale: "en" }
        )}
      </>
    );
    expect(html).toBe(
      "<style>#intro{color:red;}\n@media (min-width: 768px){.wide:hover{padding:1rem;}}</style>"
    );
  });

  it("renders nothing without content", () => {
    expect(renderPageContent(null, { locale: "en" })).toBeNull();
  });
});
