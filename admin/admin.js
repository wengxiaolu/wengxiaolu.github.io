import { planCommit, renderMarkdown, validateSite } from "../scripts/render.js";

const DEFAULTS = {
  owner: "wengxiaolu",
  repo: "wengxiaolu.github.io",
  branch: "master",
};

const state = {
  site: null,
  originalSlugs: [],
  screen: "note",
  index: 0,
};

const $ = (id) => document.getElementById(id);

function settings() {
  return {
    token: localStorage.getItem("ktech-token") || "",
    owner: DEFAULTS.owner,
    repo: DEFAULTS.repo,
    branch: localStorage.getItem("ktech-branch") || DEFAULTS.branch,
  };
}

function setStatus(id, message, isError) {
  const node = $(id);
  node.textContent = message;
  node.classList.toggle("error", Boolean(isError));
}

function today() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function blankNote() {
  return {
    slug: "",
    title: "",
    date: today(),
    summary: "",
    featured: true,
    body: "",
  };
}

async function github(path, options = {}) {
  const { token } = settings();
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data.message || `${response.status} ${text}`);
  }
  return data;
}

function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(value) {
  const binary = atob(value.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function publish(site, originalSlugs) {
  const { owner, repo, branch } = settings();
  const { files, deletions } = planCommit(site, originalSlugs);
  const ref = await github(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
  const parent = ref.object.sha;
  const commit = await github(`/repos/${owner}/${repo}/git/commits/${parent}`);
  const treeEntries = [];
  for (const [path, content] of Object.entries(files)) {
    const blob = await github(`/repos/${owner}/${repo}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content: encodeBase64(content), encoding: "base64" }),
    });
    treeEntries.push({ path, mode: "100644", type: "blob", sha: blob.sha });
  }
  for (const path of deletions) {
    treeEntries.push({ path, mode: "100644", type: "blob", sha: null });
  }
  const tree = await github(`/repos/${owner}/${repo}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: commit.tree.sha, tree: treeEntries }),
  });
  const next = await github(`/repos/${owner}/${repo}/git/commits`, {
    method: "POST",
    body: JSON.stringify({
      message: "Update site content",
      tree: tree.sha,
      parents: [parent],
    }),
  });
  await github(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: next.sha }),
  });
  return next.sha;
}

function readNoteForm() {
  const note = {
    ...state.site.notes[state.index],
    title: $("note-title").value.trim(),
    date: $("note-date").value,
    slug: $("note-slug").value.trim(),
    summary: $("note-summary").value.trim(),
    featured: $("note-featured").checked,
    body: $("body").value,
  };
  state.site.notes[state.index] = note;
}

function readForm() {
  if (state.screen === "note") readNoteForm();
  if (state.screen === "about" || state.screen === "learning") {
    const page = state.site[state.screen];
    page.title = $("page-title").value.trim();
    page.description = $("page-description").value.trim();
    page.body = $("body").value;
  }
  if (state.screen === "settings") {
    state.site.name = $("site-name").value.trim();
    state.site.description = $("site-description").value.trim();
    state.site.domain = $("site-domain").value.trim();
    state.site.year = $("site-year").value.trim();
  }
}

function showPreview() {
  if (state.screen === "settings") {
    $("preview").innerHTML = "";
    return;
  }
  $("preview").innerHTML = renderMarkdown($("body").value);
}

function renderList() {
  const list = $("note-list");
  list.innerHTML = "";
  state.site.notes.forEach((note, index) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = note.title || "未命名";
    button.classList.toggle("active", state.screen === "note" && index === state.index);
    button.addEventListener("click", () => openNote(index));
    item.append(button);
    list.append(item);
  });
  document.querySelectorAll("[data-screen]").forEach((button) => {
    button.classList.toggle("active", button.dataset.screen === state.screen);
  });
}

function fillEditor() {
  const noteMode = state.screen === "note";
  const pageMode = state.screen === "about" || state.screen === "learning";
  $("note-fields").hidden = !noteMode;
  $("page-fields").hidden = !pageMode;
  $("settings-fields").hidden = state.screen !== "settings";
  $("body-label").hidden = state.screen === "settings";
  $("delete-note").hidden = !noteMode;
  if (noteMode) {
    const note = state.site.notes[state.index];
    $("editor-title").textContent = note.title || "新笔记";
    $("note-title").value = note.title;
    $("note-date").value = note.date;
    $("note-slug").value = note.slug;
    $("note-summary").value = note.summary;
    $("note-featured").checked = Boolean(note.featured);
    $("body").value = note.body;
  } else if (pageMode) {
    const page = state.site[state.screen];
    $("editor-title").textContent = state.screen === "about" ? "About" : "Learning";
    $("page-title").value = page.title;
    $("page-description").value = page.description;
    $("body").value = page.body;
  } else {
    $("editor-title").textContent = "站点";
    $("site-name").value = state.site.name;
    $("site-description").value = state.site.description;
    $("site-domain").value = state.site.domain;
    $("site-year").value = state.site.year;
    $("body").value = "";
  }
  showPreview();
  renderList();
}

function openNote(index) {
  readForm();
  state.screen = "note";
  state.index = index;
  fillEditor();
}

function openScreen(screen) {
  readForm();
  state.screen = screen;
  fillEditor();
}

async function loadSite() {
  const local = await fetch("/content/site.json").then((response) => {
    if (!response.ok) throw new Error("读不到 content/site.json");
    return response.json();
  });
  state.site = local;
  state.originalSlugs = local.notes.map((note) => note.slug);
  const { token, owner, repo, branch } = settings();
  if (!token) return;
  try {
    const file = await github(`/repos/${owner}/${repo}/contents/content/site.json?ref=${encodeURIComponent(branch)}`);
    state.site = JSON.parse(decodeBase64(file.content));
    state.originalSlugs = state.site.notes.map((note) => note.slug);
    setStatus("token-status", `已读取 ${branch} 上的内容。`, false);
  } catch (error) {
    setStatus("token-status", `GitHub 上的内容没读到，先用了当前页面里的内容。${error.message}`, true);
  }
}

$("token").value = settings().token;
$("branch").value = settings().branch;

$("token-form").addEventListener("submit", (event) => {
  event.preventDefault();
  localStorage.setItem("ktech-token", $("token").value.trim());
  localStorage.setItem("ktech-branch", $("branch").value.trim() || DEFAULTS.branch);
  setStatus("token-status", "令牌已留在这台浏览器。", false);
});

$("forget-token").addEventListener("click", () => {
  localStorage.removeItem("ktech-token");
  $("token").value = "";
  setStatus("token-status", "令牌已清除。", false);
});

$("check-token").addEventListener("click", async () => {
  localStorage.setItem("ktech-token", $("token").value.trim());
  localStorage.setItem("ktech-branch", $("branch").value.trim() || DEFAULTS.branch);
  try {
    const user = await github("/user");
    setStatus("token-status", `令牌可用，登录身份是 ${user.login}。`, false);
  } catch (error) {
    setStatus("token-status", `令牌不可用。${error.message}`, true);
  }
});

$("new-note").addEventListener("click", () => {
  readForm();
  state.site.notes.unshift(blankNote());
  state.screen = "note";
  state.index = 0;
  fillEditor();
});

document.querySelectorAll("[data-screen]").forEach((button) => {
  button.addEventListener("click", () => openScreen(button.dataset.screen));
});

$("editor").addEventListener("input", () => {
  if (state.screen === "note") $("editor-title").textContent = $("note-title").value.trim() || "新笔记";
  showPreview();
});

$("delete-note").addEventListener("click", () => {
  const title = $("note-title").value.trim() || "这篇笔记";
  if (!confirm(`删除「${title}」？保存到 GitHub 后才会从线上消失。`)) return;
  state.site.notes.splice(state.index, 1);
  state.screen = state.site.notes.length ? "note" : "about";
  state.index = 0;
  fillEditor();
});

$("editor").addEventListener("submit", async (event) => {
  event.preventDefault();
  readForm();
  const errors = validateSite(state.site);
  if (errors.length) {
    setStatus("editor-status", errors[0], true);
    return;
  }
  if (!settings().token) {
    setStatus("editor-status", "先在上面填 GitHub 令牌，再保存。", true);
    $("token").focus();
    return;
  }
  $("save").disabled = true;
  setStatus("editor-status", "正在提交…", false);
  try {
    const sha = await publish(state.site, state.originalSlugs);
    state.originalSlugs = state.site.notes.map((note) => note.slug);
    setStatus("editor-status", `已提交 ${sha.slice(0, 7)}。等 GitHub Pages 更新后就能在网站上看到。`, false);
  } catch (error) {
    setStatus("editor-status", `没有保存。${error.message}`, true);
  } finally {
    $("save").disabled = false;
  }
});

loadSite().then(fillEditor).catch((error) => {
  setStatus("editor-status", error.message, true);
});
