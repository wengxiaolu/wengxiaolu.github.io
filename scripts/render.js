const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const NAV = [
  { href: "/index.html", label: "Home", key: "home" },
  { href: "/notes/", label: "Notes", key: "notes" },
  { href: "/learning/", label: "Learning", key: "learning" },
  { href: "/about/", label: "About", key: "about" },
  { href: "/index.html#work", label: "Work", key: "work" },
  { href: "/index.html#contact", label: "Contact", key: "contact" },
];

const MARK = `<svg class="mark" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.4"/>
          <text x="12" y="16" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="12" font-weight="700" fill="currentColor">K</text>
        </svg>`;

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safeUrl(url) {
  const value = url.trim();
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  if (/^https?:\/\//i.test(value)) return value;
  if (/^mailto:/i.test(value)) return value;
  return null;
}

function inline(text) {
  const parts = String(text).split(/(`[^`]+`)/g);
  return parts.map((part) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
    }
    const escaped = escapeHtml(part);
    const linked = escaped.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
      const safe = safeUrl(url.replace(/&amp;/g, "&"));
      if (!safe) return label;
      return `<a href="${escapeHtml(safe)}">${label}</a>`;
    });
    return linked.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }).join("");
}

export function renderMarkdown(source) {
  const lines = String(source || "").replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (line.trim().startsWith("```")) {
      const body = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        body.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      html.push(`<pre><code>${escapeHtml(body.join("\n"))}</code></pre>`);
      continue;
    }
    if (line.startsWith("### ")) {
      html.push(`<h3>${inline(line.slice(4))}</h3>`);
      index += 1;
      continue;
    }
    if (line.startsWith("## ")) {
      html.push(`<h2>${inline(line.slice(3))}</h2>`);
      index += 1;
      continue;
    }
    if (line.startsWith("- ")) {
      const items = [];
      while (index < lines.length && lines[index].startsWith("- ")) {
        items.push(`<li>${inline(lines[index].slice(2))}</li>`);
        index += 1;
      }
      html.push(`<ul>\n${items.join("\n")}\n</ul>`);
      continue;
    }
    html.push(`<p>${inline(line)}</p>`);
    index += 1;
  }
  return html.join("\n");
}

export function formatDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!match) return iso || "";
  return `${MONTHS[Number(match[2]) - 1]} ${Number(match[3])}, ${match[1]}`;
}

function formatDateReading(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!match) return formatDate(iso);
  return `${match[1]}年${Number(match[2])}月${Number(match[3])}日`;
}

export function validateSite(site) {
  const errors = [];
  if (!site || typeof site !== "object") return ["内容格式不对。"];
  if (!String(site.name || "").trim()) errors.push("站点名字不能为空。");
  if (!String(site.domain || "").trim()) errors.push("站点域名不能为空。");
  for (const key of ["about", "learning"]) {
    const page = site[key];
    if (!page || !String(page.title || "").trim()) errors.push(`${key} 需要标题。`);
    if (!page || !String(page.body || "").trim()) errors.push(`${key} 需要正文。`);
  }
  if (!Array.isArray(site.notes)) return errors.concat("笔记列表格式不对。");
  const seen = new Set();
  site.notes.forEach((note, index) => {
    const where = note.title || `第 ${index + 1} 篇`;
    if (!String(note.title || "").trim()) errors.push(`${where}：标题不能为空。`);
    if (!String(note.summary || "").trim()) errors.push(`${where}：摘要不能为空。`);
    if (!String(note.body || "").trim()) errors.push(`${where}：正文不能为空。`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(note.date || "")) errors.push(`${where}：日期用 YYYY-MM-DD。`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(note.slug || "")) {
      errors.push(`${where}：地址只能用小写英文、数字和连字符。`);
    } else if (seen.has(note.slug)) {
      errors.push(`${where}：地址 ${note.slug} 重复了。`);
    }
    seen.add(note.slug);
  });
  return errors;
}

function pageShell({ site, title, description, current, band, hero, main, bodyClass }) {
  const fullTitle = title ? `${title} | ${site.name}` : site.name;
  const nav = NAV.map((item) => {
    const currentAttr = item.key === current ? ` aria-current="page"` : "";
    return `<a href="${item.href}"${currentAttr}>${item.label}</a>`;
  }).join("\n        ");
  const heroHtml = hero
    ? `
  <section class="hero">
    <div class="container">
      <h1>${escapeHtml(site.name)}</h1>
      <p class="lede">${escapeHtml(site.description || "")}</p>
    </div>
  </section>`
    : "";
  const bandHtml = band
    ? `
  <div class="band">
    <div class="container">
      <nav class="category-list" aria-label="分类">
        ${NAV.filter((item) => item.key !== "about").map((item) => {
          const label = item.key === "home" ? "Featured" : item.label;
          const active = item.key === current ? ` class="active"` : "";
          return `<a href="${item.href}"${active}>${label}</a>`;
        }).join("\n        ")}
      </nav>
    </div>
  </div>`
    : "";
  const bodyAttr = bodyClass ? ` class="${escapeHtml(bodyClass)}"` : "";
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description || site.description || "")}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="alternate" type="application/atom+xml" title="${escapeHtml(site.name)}" href="/atom.xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@500;700&family=Nunito+Sans:ital,opsz,wght@0,6..12,500;0,6..12,700;1,6..12,500&display=swap">
  <link rel="stylesheet" href="/css/site.css">
</head>
<body${bodyAttr}>
  <div class="stage">
  <header id="header">
    <div class="container">
      <a id="brand" href="/index.html">
        ${MARK}
        <strong>${escapeHtml(site.name)}</strong>
      </a>
      <nav id="nav" aria-label="主导航">
        ${nav}
      </nav>
    </div>
  </header>${heroHtml}${bandHtml}
  ${main}
  <footer id="footer">
    <div class="container">© ${escapeHtml(site.year || "")} <a href="/about/">${escapeHtml(site.name)}</a> · <a href="/admin/">后台</a></div>
  </footer>
  </div>
</body>
</html>
`;
}

function sortedNotes(site) {
  return [...site.notes].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.title.localeCompare(b.title, "zh")));
}

function entryList(notes) {
  const items = notes.map((note) => `      <li class="entry-item">
        <div class="entry-meta">
          <time datetime="${escapeHtml(note.date)}">${escapeHtml(formatDateReading(note.date))}</time>
        </div>
        <div class="detail">
          <h2><a href="/notes/${escapeHtml(note.slug)}/">${escapeHtml(note.title)}</a></h2>
          <div class="description"><a href="/notes/${escapeHtml(note.slug)}/">${escapeHtml(note.summary)}</a></div>
        </div>
      </li>`).join("\n");
  return `<main id="main" class="container">
    <ul class="entry-list">
${items}
    </ul>
  </main>`;
}

function articlePage(site, { title, description, date, body, current, band }) {
  const meta = date
    ? `\n        <div class="entry-meta"><time datetime="${escapeHtml(date)}">${escapeHtml(formatDateReading(date))}</time></div>`
    : "";
  const dek = date && description
    ? `\n        <p class="dek">${escapeHtml(description)}</p>`
    : "";
  return pageShell({
    site,
    title,
    description,
    current,
    band,
    bodyClass: "page-article",
    main: `<article class="panel">
    <header class="article-header">
      <div class="container">${meta}
        <h1>${escapeHtml(title)}</h1>${dek}
      </div>
    </header>
    <div class="container yue entry-content">
      ${renderMarkdown(body)}
    </div>
  </article>`,
  });
}

function atom(site, notes) {
  const domain = String(site.domain).replace(/\/$/, "");
  const updated = notes[0]?.date ? `${notes[0].date}T00:00:00Z` : "1970-01-01T00:00:00Z";
  const entries = notes.map((note) => `  <entry>
    <title>${escapeHtml(note.title)}</title>
    <link href="${domain}/notes/${note.slug}/"/>
    <id>${domain}/notes/${note.slug}/</id>
    <updated>${note.date}T00:00:00Z</updated>
    <summary>${escapeHtml(note.summary)}</summary>
  </entry>`).join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeHtml(site.name)}</title>
  <link href="${domain}/"/>
  <link rel="self" href="${domain}/atom.xml"/>
  <updated>${updated}</updated>
  <id>${domain}/</id>
  <author>
    <name>${escapeHtml(site.name)}</name>
  </author>
${entries}
</feed>
`;
}

function faceMenu(href, label) {
  return `<a href="${href}">
        <span class="menu-clip">
          <span class="menu-line">${escapeHtml(label)}</span>
          <span class="menu-line">${escapeHtml(label)}</span>
        </span>
      </a>`;
}

function facePair(title, aside) {
  const side = aside ? `<p class="aside">${escapeHtml(aside)}</p>` : "";
  return `<div class="line-inner">
        <h2>${escapeHtml(title)}</h2>
        ${side}
      </div>`;
}

function faceBlock(inner, href) {
  const safe = href ? safeUrl(href) : null;
  const base = safe
    ? `<a class="line-base line-link" href="${escapeHtml(safe)}">${inner}</a>`
    : `<div class="line-base">${inner}</div>`;
  return `<div class="line">
      ${base}
      <div class="line-mask" aria-hidden="true">${inner}</div>
    </div>`;
}

function faceHistoryLine(item) {
  const inner = `<div class="line-inner history-inner">
        <p class="year">${escapeHtml(item.year || "")}</p>
        <div>
          <h3>${escapeHtml(item.title || "")}</h3>
          <p class="aside">${escapeHtml(item.place || "")}</p>
        </div>
      </div>`;
  return faceBlock(inner);
}

function linesOf(value) {
  return (Array.isArray(value) ? value : []).map((line) => escapeHtml(line)).join("");
}

function homeOf(site) {
  const home = site.home && typeof site.home === "object" ? site.home : {};
  return {
    name: home.name || site.name || "Loup Weng",
    hero: Array.isArray(home.hero) && home.hero.length ? home.hero : ["Loup", "Weng"],
    enter: home.enter || "Enter",
    introLabel: home.introLabel || "About",
    intro: Array.isArray(home.intro) ? home.intro : [],
    notesLabel: home.notesLabel || "Notes",
    workLabel: home.workLabel || "Work",
    work: Array.isArray(home.work) ? home.work : [],
    historyLabel: home.historyLabel || "History",
    history: Array.isArray(home.history) ? home.history : [],
    contactLabel: home.contactLabel || "Contact",
    socials: Array.isArray(home.socials) ? home.socials : [],
    close: Array.isArray(home.close) && home.close.length ? home.close : ["Loup", "Weng"],
  };
}

function facePage(site, notes) {
  const home = homeOf(site);
  const hero = home.hero.map((line, index) => (index === 1 ? `<strong>${escapeHtml(line)}</strong>` : escapeHtml(line))).join("<br>");
  const close = home.close.map((line, index) => (index === 1 ? `<strong>${escapeHtml(line)}</strong>` : escapeHtml(line))).join("<br>");
  const featured = notes.filter((note) => note.featured);
  const articleNotes = featured.length ? featured : notes;
  const articles = articleNotes.map((note) => faceBlock(facePair(note.title, note.summary), `/notes/${note.slug}/`)).join("\n");
  const history = home.history.map((item) => faceHistoryLine(item)).join("\n");
  const socials = home.socials.map((item) => faceBlock(facePair(item.label, item.aside), item.href)).join("\n");
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(home.name)}</title>
  <meta name="description" content="${escapeHtml(home.intro[0] || site.description || home.name)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=League+Spartan:wght@500;700&family=Nunito+Sans:ital,opsz,wght@0,6..12,500;0,6..12,700;1,6..12,500&display=swap">
  <link rel="stylesheet" href="/css/face.css">
  <script>
    try {
      if (location.hash || sessionStorage.getItem("entered")) document.documentElement.classList.add("skip-loader");
    } catch (error) {}
  </script>
</head>
<body class="face">
  <div class="loader" id="loader">
    <div class="loader-mark" aria-hidden="true"></div>
    <button class="loader-start" id="start" type="button">${escapeHtml(home.enter)}</button>
  </div>
  <header class="top">
    <a class="brand" href="/index.html" aria-label="${escapeHtml(home.name)}">
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
        <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" stroke-width="1.4"/>
      </svg>
    </a>
    <nav class="menu" aria-label="主导航">
      ${NAV.map((item) => faceMenu(item.href, item.label)).join("\n      ")}
    </nav>
  </header>
  <main>
    <section class="hero">
      <div class="hero-bg" aria-hidden="true"></div>
      <div class="hero-copy">
        <p class="eyebrow">${escapeHtml(home.name)}</p>
        <h1>${hero}</h1>
      </div>
    </section>
    <section class="chapter" id="about">
      <div class="sheet">
        <p class="eyebrow">${escapeHtml(home.introLabel)}</p>
        <p class="statement">${linesOf(home.intro)}</p>
      </div>
    </section>
    <section class="rows" id="notes" aria-label="${escapeHtml(home.notesLabel)}">
      <div class="sheet sheet-label"><p class="eyebrow"><a href="/notes/">${escapeHtml(home.notesLabel)}</a></p></div>
      ${articles}
    </section>
    <section class="chapter" id="work">
      <div class="sheet">
        <p class="eyebrow">${escapeHtml(home.workLabel)}</p>
        <p class="statement">${linesOf(home.work)}</p>
      </div>
    </section>
    <section class="rows rows-history">
      <div class="sheet sheet-label"><p class="eyebrow">${escapeHtml(home.historyLabel)}</p></div>
      ${history}
    </section>
    <section class="chapter" id="contact">
      <div class="sheet">
        <p class="eyebrow">${escapeHtml(home.contactLabel)}</p>
      </div>
      ${socials}
    </section>
    <section class="hero hero-end">
      <div class="hero-copy">
        <h1>${close}</h1>
      </div>
    </section>
  </main>
  <script src="/js/face.js"></script>
</body>
</html>
`;
}

export function renderSite(site) {
  const errors = validateSite(site);
  if (errors.length) {
    const error = new Error(errors.join("\n"));
    error.errors = errors;
    throw error;
  }
  const notes = sortedNotes(site);
  const files = {
    "index.html": facePage(site, notes),
    "notes/index.html": pageShell({
      site,
      title: "Notes",
      description: `${site.name} 的笔记列表。`,
      current: "notes",
      main: entryList(notes),
    }),
    "about/index.html": articlePage(site, {
      title: site.about.title,
      description: site.about.description,
      body: site.about.body,
      current: "about",
    }),
    "learning/index.html": articlePage(site, {
      title: site.learning.title,
      description: site.learning.description,
      body: site.learning.body,
      current: "learning",
    }),
    "404.html": pageShell({
      site,
      title: "找不到页面",
      description: "这个地址没有内容。",
      current: "",
      main: `<article class="panel">
    <header class="article-header">
      <div class="container">
        <h1>找不到页面</h1>
      </div>
    </header>
    <div class="container yue entry-content">
      <p>这个地址没有内容。回到 <a href="/index.html">首页</a>，或看 <a href="/notes/">笔记</a>。</p>
    </div>
  </article>`,
    }),
    "atom.xml": atom(site, notes),
    "content/site.json": `${JSON.stringify(site, null, 2)}\n`,
  };
  for (const note of notes) {
    files[`notes/${note.slug}/index.html`] = articlePage(site, {
      title: note.title,
      description: note.summary,
      date: note.date,
      body: note.body,
      current: "notes",
    });
  }
  return files;
}

export function planCommit(site, originalSlugs) {
  const files = renderSite(site);
  const slugs = new Set(site.notes.map((note) => note.slug));
  const deletions = [...new Set(originalSlugs)].filter((slug) => slug && !slugs.has(slug)).map((slug) => `notes/${slug}/index.html`);
  return { files, deletions };
}
