// templates/partials/series-modal.js — mid-series "start from the beginning?"
// dialog. Emitted only on blog series parts with order > 1. See CLAUDE.md §7.
// Behavior (open, focus-trap, Esc, sessionStorage) lives in assets/modal.js.

const { escapeHtml } = require("../../build/util");

/**
 * @param {object} o
 * @param {string} o.seriesName    display name of the series
 * @param {string} o.firstUrl      URL of part 1
 * @param {string} o.seriesKey     stable key for the sessionStorage flag
 */
module.exports = function seriesModal(o) {
  return `<div
        class="modal series-modal"
        id="series-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="series-modal-title"
        aria-describedby="series-modal-desc"
        data-series-first="${escapeHtml(o.firstUrl)}"
        data-series-key="${escapeHtml(o.seriesKey)}"
        hidden
      >
        <div class="modal__overlay" data-modal-dismiss></div>
        <div class="modal__card" role="document">
          <p class="eyebrow">${escapeHtml(o.seriesName)}</p>
          <h2 class="modal__title" id="series-modal-title">You're mid-series</h2>
          <p class="modal__desc" id="series-modal-desc">
            You're jumping into the middle of a series. Want to start from the beginning?
          </p>
          <div class="modal__actions">
            <a class="btn btn--primary" href="${escapeHtml(o.firstUrl)}">Go to Part 1</a>
            <button type="button" class="btn btn--outline" data-modal-dismiss>Continue here</button>
          </div>
        </div>
      </div>`;
};
