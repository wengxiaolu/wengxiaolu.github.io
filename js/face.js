const loader = document.getElementById("loader");
const start = document.getElementById("start");
const cursor = document.getElementById("cursor");

if (start && loader) {
  start.addEventListener("click", () => {
    loader.classList.add("is-done");
    loader.setAttribute("aria-hidden", "true");
  });
}

if (cursor && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  window.addEventListener("pointermove", (event) => {
    cursor.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
  });
}

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
