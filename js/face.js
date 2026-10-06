const loader = document.getElementById("loader");
const start = document.getElementById("start");

if (start && loader) {
  start.addEventListener("click", () => {
    try { sessionStorage.setItem("entered", "1"); } catch (error) {}
    loader.classList.add("is-done");
    loader.setAttribute("aria-hidden", "true");
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
