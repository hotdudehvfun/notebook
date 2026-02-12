let active_el = null;
document.addEventListener("pointermove", e => {
  const el = document.elementFromPoint(e.clientX, e.clientY);
  const clickable = el?.closest(".clickable");

  if (active_el !== clickable) {
    active_el?.classList.remove("active");
    clickable?.classList.add("active");
    active_el = clickable;
  }
});

document.addEventListener("pointerup", () => {
  if (active_el) {
    // active_el.click();
    console.log(active_el)
    active_el.classList.remove("active");
    active_el = null;
  }
});
