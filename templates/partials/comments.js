// templates/partials/comments.js — reader comments section for detail pages.
// Emitted at the bottom of project detail pages and individual blog pages when
// site.comments.enabled is true. The list is populated client-side by
// assets/comments.js, which reads data-thread + data-api. See CLAUDE.md.

const { escapeHtml } = require("../../build/util");

const AUTHOR_MAX = 25;
const BODY_MAX = 200;

/**
 * @param {object} o
 * @param {object} o.site       site.config (reads o.site.comments)
 * @param {string} o.threadId   page URL path, used as the thread key
 * @returns {string} section markup, or "" when comments are disabled
 */
module.exports = function comments(o) {
  const cfg = (o.site && o.site.comments) || {};
  if (!cfg.enabled) return "";
  const apiBase = cfg.apiBase || "/api";

  return `<section
        class="comments"
        aria-labelledby="comments-title"
        data-thread="${escapeHtml(o.threadId)}"
        data-api="${escapeHtml(apiBase)}"
      >
        <h2 class="comments__title" id="comments-title">Comments<span class="comments__count" data-count-label></span></h2>
        <form class="comments__form" novalidate>
          <div class="comments__field">
            <label class="comments__label" for="comment-author">Name <span class="comments__optional">(optional)</span></label>
            <input
              class="comments__input"
              id="comment-author"
              name="author"
              type="text"
              maxlength="${AUTHOR_MAX}"
              placeholder="Anonymous"
              autocomplete="name"
            />
          </div>
          <div class="comments__field">
            <label class="comments__label" for="comment-body">Comment</label>
            <textarea
              class="comments__textarea"
              id="comment-body"
              name="body"
              rows="3"
              maxlength="${BODY_MAX}"
              required
              placeholder="Add a comment…"
            ></textarea>
            <p class="comments__counter" data-counter aria-live="polite">0 / ${BODY_MAX}</p>
          </div>
          <div class="comments__actions">
            <button class="btn btn--primary" type="submit">Post comment</button>
            <p class="comments__status" data-status role="status" aria-live="polite"></p>
          </div>
        </form>
        <ul class="comments__list" data-list data-empty="No comments yet — be the first."></ul>
        <div
          class="modal comment-delete-modal"
          id="comment-delete-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="comment-delete-title"
          aria-describedby="comment-delete-desc"
          hidden
        >
          <div class="modal__overlay" data-delete-dismiss></div>
          <div class="modal__card" role="document">
            <p class="eyebrow">Moderation</p>
            <h2 class="modal__title" id="comment-delete-title">Delete this comment?</h2>
            <p class="modal__desc" id="comment-delete-desc">
              Enter the delete key to remove this comment. This can't be undone.
            </p>
            <div class="modal__field">
              <label class="comments__label" for="comment-delete-key">Delete key</label>
              <input
                class="comments__input"
                id="comment-delete-key"
                type="password"
                autocomplete="off"
                data-delete-key
              />
              <p class="modal__error" data-delete-error hidden></p>
            </div>
            <div class="modal__actions">
              <button type="button" class="btn btn--primary" data-delete-confirm>Delete comment</button>
              <button type="button" class="btn btn--outline" data-delete-dismiss>Cancel</button>
            </div>
          </div>
        </div>
      </section>`;
};