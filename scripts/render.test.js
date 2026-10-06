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
assert.match(files["index.html"], /sessionStorage\.getItem\("entered"\)/);
assert.match(files["index.html"], /location\.hash/);
assert.match(files["index.html"], /menu-line">Home<\/span>[\s\S]*menu-line">Notes<\/span>[\s\S]*menu-line">Learning<\/span>[\s\S]*menu-line">About<\/span>[\s\S]*menu-line">Work<\/span>[\s\S]*menu-line">Contact<\/span>/);
assert.match(files["index.html"], /id="about"/);
assert.match(files["index.html"], /id="notes"/);
assert.match(files["index.html"], /id="work"/);
assert.match(files["index.html"], /id="contact"/);
const sharedMenu = /href="\/index\.html">Home<\/[\s\S]*href="\/notes\/"(?: aria-current="page")?>Notes<\/[\s\S]*href="\/learning\/"(?: aria-current="page")?>Learning<\/[\s\S]*href="\/about\/"(?: aria-current="page")?>About<\/[\s\S]*href="\/index\.html#work">Work<\/[\s\S]*href="\/index\.html#contact">Contact<\//;
assert.match(files["index.html"], /href="\/index\.html" aria-current="page">[\s\S]*menu-line">Home<\/span>[\s\S]*href="\/notes\/">[\s\S]*menu-line">Notes<\/span>[\s\S]*href="\/learning\/">[\s\S]*menu-line">Learning<\/span>[\s\S]*href="\/about\/">[\s\S]*menu-line">About<\/span>[\s\S]*href="\/index\.html#work">[\s\S]*menu-line">Work<\/span>[\s\S]*href="\/index\.html#contact">[\s\S]*menu-line">Contact<\/span>/);
for (const file of ["notes/index.html", "notes/hello-note/index.html", "about/index.html", "learning/index.html", "404.html"]) {
  assert.match(files[file], sharedMenu, file);
  assert.doesNotMatch(files[file], /href="#(?:about|work|contact)"|quiet-link/, file);
}
assert.doesNotMatch(files["index.html"], /href="#(?:about|work|contact)"/);
assert.doesNotMatch(files["notes/index.html"], /wengxiaolu\.cn/);
assert.match(files["notes/index.html"], /2026年10月5日/);
assert.doesNotMatch(files["notes/index.html"], /category-list/);
assert.doesNotMatch(files["learning/index.html"], /category-list/);
assert.match(files["about/index.html"], /class="panel"/);
assert.match(files["notes/hello-note/index.html"], /一行。/);
assert.match(files["notes/hello-note/index.html"], /class="page-article"/);
assert.match(files["notes/hello-note/index.html"], /2026年10月5日/);
assert.match(files["notes/hello-note/index.html"], /class="dek"/);
assert.match(files["notes/hello-note/index.html"], /摘要/);
assert.match(files["about/index.html"], /class="page-article"/);
assert.doesNotMatch(files["notes/index.html"], /page-article|quiet-link/);
assert.doesNotMatch(files["404.html"], /page-article/);
assert.match(files["atom.xml"], /<summary>摘要<\/summary>/);
assert.equal(validateSite({ ...site, notes: [{ ...site.notes[0], slug: "Bad Slug" }] }).some((item) => item.includes("地址")), true);

console.log("render tests passed");
