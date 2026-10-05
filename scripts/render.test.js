import assert from "node:assert/strict";
import { planCommit, renderMarkdown, validateSite } from "./render.js";

const site = {
  name: "K_Tech",
  description: "desc",
  domain: "https://www.wengxiaolu.cn",
  year: "2026",
  about: { title: "About", description: "about", body: "你好" },
  learning: { title: "Learning", description: "learning", body: "项目" },
  notes: [
    {
      slug: "hello-note",
      title: "标题",
      date: "2026-10-05",
      summary: "摘要",
      featured: true,
      body: "一行。\n\n## 小节\n\n- [站内](/about/)\n- **加粗** 和 `code`\n\n<script>alert(1)</script>\n\n[坏链接](javascript:alert(1))",
    },
  ],
};

const html = renderMarkdown(site.notes[0].body);
assert.match(html, /<h2>小节<\/h2>/);
assert.match(html, /<a href="\/about\/">站内<\/a>/);
assert.match(html, /<strong>加粗<\/strong>/);
assert.match(html, /<code>code<\/code>/);
assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.doesNotMatch(html, /javascript:alert/);

const { files, deletions } = planCommit(site, ["hello-note", "old-note"]);
assert.equal(deletions.join(","), "notes/old-note/index.html");
assert.match(files["index.html"], /标题/);
assert.match(files["notes/hello-note/index.html"], /一行。/);
assert.match(files["atom.xml"], /<summary>摘要<\/summary>/);
assert.equal(validateSite({ ...site, notes: [{ ...site.notes[0], slug: "Bad Slug" }] }).some((item) => item.includes("地址")), true);

console.log("render tests passed");
