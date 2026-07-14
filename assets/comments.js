// assets/comments.js — client behavior for the comments section.
// Emitted on project detail + individual blog pages when site.comments.enabled.
// Reads data-thread (the page URL path) and data-api (base, default /api) from
// the .comments section, fetches/renders comments, posts new ones, and deletes
// with a key prompt. Comment text is rendered via textContent (never innerHTML),
// so stored text cannot inject markup.
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

  // Build one <li> for a comment via DOM APIs (textContent = no injection).
  function renderComment(c) {
    var li = document.createElement("li");
    li.className = "comments__item";
    li.setAttribute("data-id", c.id);

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
    del.textContent = "Delete";
    del.addEventListener("click", function () {
      onDelete(c.id, li);
    });

    head.appendChild(author);
    head.appendChild(date);
    head.appendChild(del);

    var body = document.createElement("p");
    body.className = "comments__body";
    body.textContent = c.body;

    li.appendChild(head);
    li.appendChild(body);
    return li;
  }

  function render(comments) {
    list.innerHTML = "";
    section.classList.remove("is-unavailable");
    if (!comments.length) {
      list.setAttribute("data-count", "0");
      return; // CSS ::after shows the data-empty message
    }
    list.setAttribute("data-count", String(comments.length));
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

  function onDelete(id, li) {
    var key = window.prompt("Enter the delete key to remove this comment:");
    if (key == null) return; // cancelled
    fetch(endpoint + "/" + encodeURIComponent(id), {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "X-Delete-Key": key },
      body: JSON.stringify({ key: key }),
    })
      .then(function (r) {
        if (r.status === 204) {
          li.parentNode && li.parentNode.removeChild(li);
          var remaining = list.querySelectorAll(".comments__item").length;
          list.setAttribute("data-count", String(remaining));
          return;
        }
        if (r.status === 403) throw new Error("Incorrect delete key.");
        throw new Error("Could not delete (HTTP " + r.status + ").");
      })
      .catch(function (err) {
        window.alert(err.message || "Could not delete comment.");
      });
  }

  if (counter && bodyInput) {
    bodyInput.addEventListener("input", function () {
      counter.textContent = bodyInput.value.length + " / " + BODY_MAX;
    });
  }
  if (form) form.addEventListener("submit", onSubmit);

  load();
})();