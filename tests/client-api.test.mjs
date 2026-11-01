import test from "node:test";
import assert from "node:assert/strict";
import { postJSON } from "../lib/client-api.js";

test("recipe requests handle hosting timeouts, service errors, and successful recipes", async () => {
  const original = globalThis.fetch;
  const items = ["Capscium", "Chicken", "Tomato"].map(name => ({ name, quantity: 1 }));
  try {
    globalThis.fetch = async () => new Response("FUNCTION_INVOCATION_TIMEOUT", { status: 504 });
    await assert.rejects(() => postJSON("/api/recipes", { items }), /took too long/);
    globalThis.fetch = async () => Response.json({ error: "Gemini's usage limit was reached." }, { status: 429 });
    await assert.rejects(() => postJSON("/api/recipes", { items }), /usage limit/);
    globalThis.fetch = async (_path, options) => {
      assert.deepEqual(JSON.parse(options.body), { items });
      return Response.json({ recipes: [{ title: "Chicken and pepper skillet" }], mode: "gemini" });
    };
    assert.equal((await postJSON("/api/recipes", { items })).recipes[0].title, "Chicken and pepper skillet");
    globalThis.fetch = async () => { throw new TypeError("Load failed"); };
    await assert.rejects(() => postJSON("/api/recipes", { items }), /Check your connection/);
  } finally {
    globalThis.fetch = original;
  }
});
