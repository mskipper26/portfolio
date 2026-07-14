// assets/comments.js — client behavior for the comments section.
// Emitted on project detail + individual blog pages when site.comments.enabled.
// Reads data-thread (the page URL path) and data-api (base, default /api) from
// the .comments section, fetches/renders comments, posts new ones, and deletes
// via a styled key modal. Comment text is rendered via textContent (never
// innerHTML), so stored text cannot inject markup.
(function () {
  "use strict";

  var section = document.querySelector(".comments[data-thread]");
  if (!section) return;

  var thread = section.getAttribute("data-thread");
  var apiBase = (section.getAttribute("data-api") || "/api").replace(/\/+$/, "");
  var endpoint = apiBase + "/comments";

  var form = section.querySelector(".comments__form");
  var authorInput = section.querySelector("#comment-author");
  var bodyInput = section.querySelector("#comment-body");
  var counter = section.querySelector("[data-counter]");
  var statusEl = section.querySelector("[data-status]");
  var list = section.querySelector("[data-list]");
  var countLabel = section.querySelector("[data-count-label]");
  var submitBtn = form ? form.querySelector('button[type="submit"]') : null;

  var BODY_MAX = 200;

  function setStatus(msg, isError) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.classList.toggle("is-error", !!isError);
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "";
    }
  }

  function initial(name) {
    var s = (name || "").trim();
    return s ? s.charAt(0).toUpperCase() : "?";
  }

  // Build one <li> for a comment via DOM APIs (textContent = no injection).
  function renderComment(c) {
    var li = document.createElement("li");
    li.className = "comments__item";
    li.setAttribute("data-id", c.id);

    var avatar = document.createElement("div");
    avatar.className = "comments__avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = initial(c.author);

    var main = document.createElement("div");
    main.className = "comments__item-main";

    var head = document.createElement("div");
    head.className = "comments__item-head";

    var author = document.createElement("span");
    author.className = "comments__author";
    author.textContent = c.author;

    var date = document.createElement("span");
    date.className = "comments__date";
    date.textContent = formatDate(c.created_at);

    var del = document.createElement("button");
    del.type = "button";
    del.className = "comments__delete";
    del.setAttribute("aria-label", "Delete comment");
    del.title = "Delete comment";
    // Static, developer-authored trash-can icon (feather "trash-2"). Not user
    // content, so innerHTML is safe here.
    del.innerHTML =
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
    del.addEventListener("click", function () {
      openDeleteModal(c.id, li);
    });

    head.appendChild(author);
    head.appendChild(date);
    head.appendChild(del);

    var body = document.createElement("p");
    body.className = "comments__body";
    body.textContent = c.body;

    main.appendChild(head);
    main.appendChild(body);

    li.appendChild(avatar);
    li.appendChild(main);
    return li;
  }

  function setCount(n) {
    list.setAttribute("data-count", String(n));
    if (countLabel) countLabel.textContent = n ? " · " + n : "";
  }

  function render(comments) {
    list.innerHTML = "";
    section.classList.remove("is-unavailable");
    setCount(comments.length);
    comments.forEach(function (c) {
      list.appendChild(renderComment(c));
    });
  }

  function load() {
    fetch(endpoint + "?thread=" + encodeURIComponent(thread), {
      headers: { Accept: "application/json" },
    })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        render((data && data.comments) || []);
      })
      .catch(function () {
        section.classList.add("is-unavailable");
        list.innerHTML = "";
        if (countLabel) countLabel.textContent = "";
        var note = document.createElement("li");
        note.className = "comments__note";
        note.textContent = "Comments are unavailable right now.";
        list.appendChild(note);
      });
  }

  function onSubmit(e) {
    e.preventDefault();
    var body = (bodyInput.value || "").trim();
    if (!body) {
      setStatus("Comment cannot be empty.", true);
      bodyInput.focus();
      return;
    }
    if (submitBtn) submitBtn.disabled = true;
    setStatus("Posting…", false);

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        thread: thread,
        author: (authorInput.value || "").trim(),
        body: body,
      }),
    })
      .then(function (r) {
        return r.json().then(function (data) {
          if (!r.ok) throw new Error((data && data.error) || "HTTP " + r.status);
          return data;
        });
      })
      .then(function () {
        bodyInput.value = "";
        if (counter) counter.textContent = "0 / " + BODY_MAX;
        setStatus("Posted.", false);
        load();
      })
      .catch(function (err) {
        setStatus(err.message || "Could not post comment.", true);
      })
      .finally(function () {
        if (submitBtn) submitBtn.disabled = false;
      });
  }

  // --- delete modal --------------------------------------------------------
  // A styled dialog (matching the series modal) that collects the delete key,
  // replacing the browser prompt()/alert() pair.

  var modal = section.querySelector("#comment-delete-modal");
  var keyInput = section.querySelector("[data-delete-key]");
  var errorEl = section.querySelector("[data-delete-error]");
  var confirmBtn = section.querySelector("[data-delete-confirm]");
  var pending = null; // { id, li }
  var lastFocused = null;

  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg || "";
    errorEl.hidden = !msg;
  }

  function openDeleteModal(id, li) {
    if (!modal) return; // partial not present — nothing to do
    pending = { id: id, li: li };
    lastFocused = document.activeElement;
    showError("");
    if (keyInput) keyInput.value = "";
    if (confirmBtn) confirmBtn.disabled = false;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    if (keyInput) keyInput.focus();
    document.addEventListener("keydown", onModalKeydown);
  }

  function closeDeleteModal() {
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onModalKeydown);
    pending = null;
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function focusable() {
    return Array.prototype.slice.call(
      modal.querySelectorAll(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  function onModalKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeDeleteModal();
      return;
    }
    if (e.key === "Enter" && e.target === keyInput) {
      e.preventDefault();
      confirmDelete();
      return;
    }
    if (e.key === "Tab") {
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

  function confirmDelete() {
    if (!pending) return;
    var key = keyInput ? keyInput.value : "";
    var target = pending;
    showError("");
    if (confirmBtn) confirmBtn.disabled = true;

    fetch(endpoint + "/" + encodeURIComponent(target.id), {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "X-Delete-Key": key },
      body: JSON.stringify({ key: key }),
    })
      .then(function (r) {
        if (r.status === 204) {
          if (target.li.parentNode) target.li.parentNode.removeChild(target.li);
          setCount(list.querySelectorAll(".comments__item").length);
          closeDeleteModal();
          return;
        }
        if (confirmBtn) confirmBtn.disabled = false;
        if (r.status === 403) {
          showError("Incorrect delete key.");
          if (keyInput) {
            keyInput.focus();
            keyInput.select();
          }
          return;
        }
        showError("Could not delete (HTTP " + r.status + ").");
      })
      .catch(function () {
        if (confirmBtn) confirmBtn.disabled = false;
        showError("Could not reach the server.");
      });
  }

  if (modal) {
    modal.querySelectorAll("[data-delete-dismiss]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        closeDeleteModal();
      });
    });
    if (confirmBtn) confirmBtn.addEventListener("click", confirmDelete);
  }

  if (counter && bodyInput) {
    bodyInput.addEventListener("input", function () {
      counter.textContent = bodyInput.value.length + " / " + BODY_MAX;
    });
  }
  if (form) form.addEventListener("submit", onSubmit);

  load();
})();