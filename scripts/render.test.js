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
assert.match(files["index.html"], /Loup/);
assert.match(files["index.html"], /标题/);
assert.match(files["index.html"], /href="\/notes\/hello-note\/"/);
assert.match(files["index.html"], /\/css\/face.css/);
assert.match(files["index.html"], /\/js\/face.js/);
assert.doesNotMatch(files["index.html"], /id="field"/);
assert.doesNotMatch(files["index.html"], /Minh|good shit|Fantasy/i);
assert.match(files["notes/index.html"], /标题/);
assert.match(files["notes/index.html"], /href="\/index\.html">Home</);
assert.match(files["index.html"], /class="brand" href="\/index\.html"/);
assert.doesNotMatch(files["notes/index.html"], /wengxiaolu\.cn/);
assert.match(files["notes/index.html"], /2026年10月5日/);
assert.doesNotMatch(files["notes/index.html"], /category-list/);
assert.doesNotMatch(files["learning/index.html"], /category-list/);
assert.match(files["about/index.html"], /class="panel"/);
assert.match(files["notes/hello-note/index.html"], /一行。/);
assert.match(files["notes/hello-note/index.html"], /class="page-article"/);
assert.match(files["notes/hello-note/index.html"], /2026年10月5日/);
assert.match(files["notes/hello-note/index.html"], /class="quiet-link" href="\/notes\/">笔记<\/a>/);
assert.match(files["notes/hello-note/index.html"], /class="dek"/);
assert.doesNotMatch(files["about/index.html"], /quiet-link/);
assert.match(files["notes/hello-note/index.html"], /摘要/);
assert.match(files["about/index.html"], /class="page-article"/);
assert.doesNotMatch(files["notes/index.html"], /page-article|quiet-link/);
assert.doesNotMatch(files["404.html"], /page-article/);
assert.match(files["atom.xml"], /<summary>摘要<\/summary>/);
assert.equal(validateSite({ ...site, notes: [{ ...site.notes[0], slug: "Bad Slug" }] }).some((item) => item.includes("地址")), true);

console.log("render tests passed");
