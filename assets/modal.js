// assets/modal.js — series "start from the beginning?" modal behavior.
// See CLAUDE.md §7. Emitted only on blog series parts with order > 1.
(function () {
  "use strict";
  var modal = document.getElementById("series-modal");
  if (!modal) return;

  var key = modal.getAttribute("data-series-key") || "series";

  // Already dismissed this series this session? Don't nag.
  try {
    if (sessionStorage.getItem(key) === "1") return;
  } catch (e) {
    /* sessionStorage unavailable — show anyway */
  }

  var lastFocused = null;

  function focusable() {
    return Array.prototype.slice.call(
      modal.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  function open() {
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    var f = focusable();
    if (f.length) f[0].focus();
    document.addEventListener("keydown", onKeydown);
  }

  function dismiss() {
    try {
      sessionStorage.setItem(key, "1");
    } catch (e) {}
    modal.hidden = true;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKeydown);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function onKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      dismiss();
      return;
    }
    if (e.key === "Tab") {
      // simple focus trap
      var f = focusable();
      if (!f.length) return;
      var first = f[0];
      var last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // "Continue here" buttons + overlay dismiss. The "Go to Part 1" link is a
  // real anchor and navigates on its own.
  modal.querySelectorAll("[data-modal-dismiss]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      dismiss();
    });
  });

  open();
})();
