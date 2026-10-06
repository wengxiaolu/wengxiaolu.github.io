const loader = document.getElementById("loader");
const start = document.getElementById("start");

if (start && loader) {
  start.addEventListener("click", () => {
    try { sessionStorage.setItem("entered", "1"); } catch (error) {}
    loader.classList.add("is-done");
    loader.setAttribute("aria-hidden", "true");
  });
}

function markMenu() {
  const hash = location.hash;
  document.querySelectorAll(".menu a").forEach((link) => {
    const href = link.getAttribute("href") || "";
    const current = hash ? href.endsWith(hash) : href === "/index.html";
    if (current) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

markMenu();
window.addEventListener("hashchange", markMenu);

const coarse = window.matchMedia("(pointer: coarse)").matches;
if (coarse) {
  document.querySelectorAll(".line").forEach((line) => {
    line.addEventListener("click", () => {
      const open = line.classList.toggle("is-open");
      if (!open) return;
      document.querySelectorAll(".line.is-open").forEach((other) => {
        if (other !== line) other.classList.remove("is-open");
      });
    });
  });
}
