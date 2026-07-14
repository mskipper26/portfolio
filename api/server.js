// api/server.js — minimal comment API for the portfolio.
//
// Node's built-in http + the `pg` driver (single dependency), matching the
// project's zero-framework aesthetic (see the static server.js at repo root).
// Runs in the `api` container defined in docker-compose.yml, published on
// 127.0.0.1:8138 and fronted by the site's reverse proxy at /api/.
//
// Routes (a leading /api is optional, so both a same-origin /api/… proxy path
// and a bare-root subdomain like api.example.com/… work with no path rewrite):
//   GET    [/api]/health
//   GET    [/api]/comments?thread=<url-path>
//   POST   [/api]/comments            { thread, author, body }
//   DELETE [/api]/comments/:id        { key }  (or X-Delete-Key header)
//
// Config via env (docker-compose passes these from .env):
//   DATABASE_URL           postgres connection string (preferred), OR discrete
//   PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE
//   COMMENT_DELETE_KEY     required for DELETE to work
//   API_PORT               listen port (default 8138)
//   API_HOST               listen host (default 0.0.0.0 inside the container)
//   ALLOW_ORIGIN           optional CORS origin (unset in prod = same-origin)
//   BANNED_WORDS_FILE      profanity blocklist (default ./banned-words.txt)

const http = require("http");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const PORT = Number(process.env.API_PORT) || 8138;
const HOST = process.env.API_HOST || "0.0.0.0";
const DELETE_KEY = process.env.COMMENT_DELETE_KEY || "";
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "";
const BANNED_WORDS_FILE =
  process.env.BANNED_WORDS_FILE || path.join(__dirname, "banned-words.txt");

const AUTHOR_MAX = 25;
const BODY_MAX = 200;
const DEFAULT_AUTHOR = "Anonymous";
const MAX_BODY_BYTES = 16 * 1024; // request body size cap

// --- profanity filter ------------------------------------------------------
// Load the blocklist once at startup into a Set of base words. Missing file →
// filtering is simply disabled (logged), so the API still runs.
const BANNED_WORDS = loadBannedWords(BANNED_WORDS_FILE);

function loadBannedWords(file) {
  const set = new Set();
  try {
    const raw = fs.readFileSync(file, "utf8");
    for (const line of raw.split(/\r?\n/)) {
      const word = line.trim().toLowerCase();
      if (word && !word.startsWith("#")) set.add(word);
    }
    console.log(`comment-api: loaded ${set.size} banned words from ${file}`);
  } catch (err) {
    console.warn(`⚠ banned-words file not loaded (${err.message}) — profanity filter disabled.`);
  }
  return set;
}

// Leet → letter map so "sh1t"/"a$$" normalize before matching.
const LEET = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s" };

/**
 * True if any word in `text` is on the blocklist. Normalizes each word by
 * lowercasing, undoing leet substitutions, and collapsing runs of a repeated
 * letter (so "fuuuck" → "fuck"), then matches whole words only — this keeps the
 * Scunthorpe problem at bay (substrings of clean words are never flagged).
 */
function containsBannedWord(text) {
  if (!BANNED_WORDS.size || !text) return false;
  const normalized = String(text)
    .toLowerCase()
    .replace(/[013457@$]/g, (ch) => LEET[ch] || ch);
  for (const token of normalized.split(/[^a-z]+/)) {
    if (!token) continue;
    if (BANNED_WORDS.has(token)) return true;
    const collapsed = token.replace(/(.)\1+/g, "$1"); // "coool" → "col"
    if (collapsed !== token && BANNED_WORDS.has(collapsed)) return true;
  }
  return false;
}

// `pg` reads DATABASE_URL or the discrete PG* vars from the environment.
const pool = new Pool(
  process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {}
);

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS comments (
    id         BIGSERIAL    PRIMARY KEY,
    thread     TEXT         NOT NULL,
    author     VARCHAR(${AUTHOR_MAX})  NOT NULL,
    body       VARCHAR(${BODY_MAX}) NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
  );
  CREATE INDEX IF NOT EXISTS comments_thread_idx ON comments (thread, created_at);
`;

/** Run the schema idempotently on startup (retrying while the DB warms up). */
async function ensureSchema(retries = 10) {
  for (let attempt = 1; ; attempt++) {
    try {
      await pool.query(SCHEMA);
      return;
    } catch (err) {
      if (attempt >= retries) throw err;
      console.warn(
        `db not ready (attempt ${attempt}/${retries}): ${err.message} — retrying…`
      );
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

// --- helpers ---------------------------------------------------------------

function setCors(res) {
  if (!ALLOW_ORIGIN) return; // same-origin in prod: no CORS headers needed
  res.setHeader("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Delete-Key");
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendEmpty(res, status) {
  res.writeHead(status);
  res.end();
}

/** Read + JSON-parse a request body with a size cap. Resolves null on failure. */
function readJsonBody(req) {
  return new Promise((resolve) => {
    let size = 0;
    const chunks = [];
    let aborted = false;
    req.on("data", (chunk) => {
      if (aborted) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        aborted = true;
        resolve(undefined); // signal "too large"
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (aborted) return;
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(null); // malformed JSON
      }
    });
    req.on("error", () => resolve(null));
  });
}

/** Constant-time compare of the supplied key against COMMENT_DELETE_KEY. */
function keyMatches(supplied) {
  if (!DELETE_KEY) return false; // no key configured → deletes disabled
  const a = Buffer.from(String(supplied || ""), "utf8");
  const b = Buffer.from(DELETE_KEY, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// --- route handlers --------------------------------------------------------

async function getComments(res, thread) {
  if (!thread || typeof thread !== "string") {
    return sendJson(res, 400, { error: "missing thread" });
  }
  const { rows } = await pool.query(
    "SELECT id, author, body, created_at FROM comments WHERE thread = $1 ORDER BY created_at ASC, id ASC",
    [thread]
  );
  sendJson(res, 200, { comments: rows });
}

async function postComment(req, res) {
  const data = await readJsonBody(req);
  if (data === undefined) return sendJson(res, 413, { error: "body too large" });
  if (data === null) return sendJson(res, 400, { error: "invalid JSON" });

  const thread = typeof data.thread === "string" ? data.thread.trim() : "";
  let author = typeof data.author === "string" ? data.author.trim() : "";
  const body = typeof data.body === "string" ? data.body.trim() : "";

  if (!thread) return sendJson(res, 400, { error: "missing thread" });
  if (!body) return sendJson(res, 400, { error: "comment cannot be empty" });
  if (body.length > BODY_MAX)
    return sendJson(res, 400, { error: `comment exceeds ${BODY_MAX} characters` });
  if (author.length > AUTHOR_MAX)
    return sendJson(res, 400, { error: `name exceeds ${AUTHOR_MAX} characters` });
  if (containsBannedWord(body) || containsBannedWord(author))
    return sendJson(res, 400, {
      error: "Please keep it respectful — that contains language that isn't allowed.",
    });
  if (!author) author = DEFAULT_AUTHOR; // empty name → Anonymous

  const { rows } = await pool.query(
    "INSERT INTO comments (thread, author, body) VALUES ($1, $2, $3) RETURNING id, author, body, created_at",
    [thread, author, body]
  );
  sendJson(res, 201, { comment: rows[0] });
}

async function deleteComment(req, res, id) {
  if (!/^\d+$/.test(id)) return sendJson(res, 400, { error: "invalid id" });

  const data = (await readJsonBody(req)) || {};
  const supplied = req.headers["x-delete-key"] || data.key;
  if (!keyMatches(supplied)) return sendJson(res, 403, { error: "invalid key" });

  const { rowCount } = await pool.query("DELETE FROM comments WHERE id = $1", [id]);
  if (rowCount === 0) return sendJson(res, 404, { error: "not found" });
  sendEmpty(res, 204);
}

// --- server ----------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  setCors(res);
  try {
    const url = new URL(req.url, "http://localhost");
    // Normalize: drop a trailing slash, then an OPTIONAL leading /api segment so
    // routes work whether the API is fronted at a path (same-origin /api/…) or
    // at the root of a subdomain (api.example.com/…). The proxy/tunnel does not
    // need to rewrite the path either way.
    let pathname = url.pathname.replace(/\/+$/, "") || "/";
    pathname = pathname.replace(/^\/api(?=\/|$)/, "") || "/";

    if (req.method === "OPTIONS") return sendEmpty(res, 204);

    if (pathname === "/health") {
      return sendJson(res, 200, { ok: true });
    }

    if (pathname === "/comments") {
      if (req.method === "GET") return await getComments(res, url.searchParams.get("thread"));
      if (req.method === "POST") return await postComment(req, res);
      res.setHeader("allow", "GET, POST");
      return sendJson(res, 405, { error: "method not allowed" });
    }

    const del = pathname.match(/^\/comments\/(\d+)$/);
    if (del) {
      if (req.method === "DELETE") return await deleteComment(req, res, del[1]);
      res.setHeader("allow", "DELETE");
      return sendJson(res, 405, { error: "method not allowed" });
    }

    sendJson(res, 404, { error: "not found" });
  } catch (err) {
    console.error("request error:", err);
    sendJson(res, 500, { error: "internal error" });
  }
});

ensureSchema()
  .then(() => {
    server.listen(PORT, HOST, () => {
      console.log(`comment-api: listening on http://${HOST}:${PORT}`);
      if (!DELETE_KEY) console.warn("⚠ COMMENT_DELETE_KEY is unset — deletes are disabled.");
    });
  })
  .catch((err) => {
    console.error("✗ failed to initialize database schema:", err.message);
    process.exit(1);
  });