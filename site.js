(function () {
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  function setOpen(open) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("nav-open", open);
  }

  toggle.addEventListener("click", function () {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setOpen(false);
  });

  nav.addEventListener("click", function (e) {
    var link = e.target.closest("a");
    if (link) setOpen(false);
  });
})();

(function () {
  var dialog;

  function open(src, caption, alt) {
    if (!dialog) {
      dialog = document.createElement("dialog");
      dialog.className = "lightbox";
      dialog.innerHTML =
        '<button type="button" class="lightbox-close" aria-label="Close">×</button>' +
        '<figure class="lightbox-figure"><img alt="" /><figcaption></figcaption></figure>';
      dialog.addEventListener("click", function (e) {
        if (e.target === dialog || e.target.closest(".lightbox-close")) dialog.close();
      });
      document.body.appendChild(dialog);
    }
    var img = dialog.querySelector("img");
    img.src = src;
    img.alt = alt || caption || "";
    dialog.querySelector("figcaption").textContent = caption || "";
    dialog.showModal();
  }

  document.addEventListener("click", function (e) {
    var link = e.target.closest("[data-lightbox]");
    if (!link || typeof HTMLDialogElement !== "function") return;
    e.preventDefault();
    open(link.getAttribute("href"), link.dataset.caption, link.dataset.alt);
  });
})();
