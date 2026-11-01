"use client";
import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import {
  cloudEnabled,
  ensureUser,
  watchItems,
  changeItem,
  login,
  logout,
  observeAuth,
} from "../lib/firebase";
import { itemId, validateItem, mergeItem, sample } from "../lib/inventory";
import { postJSON as api } from "../lib/client-api";
const blank = { name: "", quantity: 1, category: "Produce", expires: "" };
export default function Pantry() {
  const [items, setItems] = useState([]),
    [ready, setReady] = useState(false),
    [user, setUser] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All"),
    [form, setForm] = useState(blank),
    [recipes, setRecipes] = useState(null),
    [recipeMode, setRecipeMode] = useState(""),
    [image, setImage] = useState("");
  useEffect(() => {
    if (!cloudEnabled) {
      try {
        const saved = localStorage.getItem("pantry-v1");
        setItems(saved ? JSON.parse(saved) : sample);
      } catch {
        setError("Saved data could not be read.");
      }
      setReady(true);
      return;
    }
    let stopItems = () => {};
    const stopAuth = observeAuth(
      (u) => {
        stopItems();
        setItems([]);
        setUser(u);
        setReady(false);
        if (u)
          stopItems = watchItems(
            u.uid,
            (data) => {
              setItems(data);
              setReady(true);
            },
            (e) => {
              setError(
                "Unable to load pantry. Check Firebase rules and configuration.",
              );
              setReady(false);
            },
          );
        else ensureUser().catch((e) => setError(e.message));
      },
      (e) => setError(e.message),
    );
    return () => {
      stopAuth();
      stopItems();
    };
  }, []);
  useEffect(() => {
    if (ready && !cloudEnabled)
      try {
        localStorage.setItem("pantry-v1", JSON.stringify(items));
      } catch {
        setError("Browser storage is full; changes cannot be saved.");
      }
  }, [items, ready]);
  async function act(fn) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function mutate(id, fn) {
    if (cloudEnabled) {
      if (!user) throw new Error("Wait for sign-in.");
      await changeItem(user.uid, id, fn);
    } else
      setItems((prev) => {
        const current = prev.find((x) => x.id === id);
        const next = fn(current);
        return next
          ? [...prev.filter((x) => x.id !== id), { id, ...next }]
          : prev.filter((x) => x.id !== id);
      });
  }
  async function add(e) {
    e.preventDefault();
    let next;
    try {
      next = validateItem(form);
      const current = items.find((i) => i.id === itemId(next.name));
      mergeItem(current, next);
    } catch (e) {
      setError(e.message);
      return;
    }
    await act(async () => {
      await mutate(itemId(next.name), (old) => mergeItem(old, next));
      setForm(blank);
    });
  }
  async function photo(file) {
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 3 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG, or WebP smaller than 3 MB.");
      return;
    }
    await act(async () => {
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setImage(data);
      const d = await api("/api/classify", { image: data });
      setForm({ ...blank, ...d.item });
    });
  }
  const visible = items
    .filter(
      (i) =>
        i.name.toLowerCase().includes(query.toLowerCase()) &&
        (filter === "All" || i.category === filter),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <>
      <header>
        <a className="brand" href="/">
          <span>P</span>pantry.
        </a>
        <div className="row">
          <span className="badge">
            {cloudEnabled
              ? "Firebase sync"
              : "Local demo · saved in this browser"}
          </span>
          {cloudEnabled && (
            <button
              className="secondary small"
              onClick={() =>
                act(() => (user && !user.isAnonymous ? logout() : login()))
              }
            >
              {user && !user.isAnonymous ? "Sign out" : "Sign in with Google"}
            </button>
          )}
        </div>
      </header>
      <main id="main">
        <p className="eyebrow">Your kitchen, considered</p>
        <h1>
          Good food starts
          <br />
          with what you have.
        </h1>
        <p className="intro">
          A little organization. A lot less waste. Keep track of the essentials
          and find your next meal.
        </p>
        <div className="stats">
          <div>
            <strong>{items.length}</strong>
            <span>pantry staples</span>
          </div>
          <div>
            <strong>{items.reduce((n, i) => n + i.quantity, 0)}</strong>
            <span>items on hand</span>
          </div>
          <div>
            <strong>{items.filter((i) => i.quantity <= 2).length}</strong>
            <span>running low</span>
          </div>
        </div>
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        <div className="columns">
          <section className="panel">
            <div className="row between">
              <h2>Your shelves</h2>
              <span className="badge">{visible.length} items</span>
            </div>
            <div className="toolbar">
              <input
                aria-label="Search pantry"
                placeholder="Find an ingredient…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                style={{ width: "auto" }}
                aria-label="Filter category"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                {["All", "Produce", "Grains", "Dairy", "Protein", "Other"].map(
                  (c) => (
                    <option key={c}>{c}</option>
                  ),
                )}
              </select>
            </div>
            {!ready ? (
              <p role="status">Loading your pantry…</p>
            ) : visible.length === 0 ? (
              <div className="empty">
                {items.length
                  ? "No ingredients match your search."
                  : "Your shelf is ready for its first ingredient."}
              </div>
            ) : (
              visible.map((i) => (
                <article className="item" key={i.id}>
                  <div className="row between">
                    <div>
                      <h3 style={{ margin: 0 }}>{i.name}</h3>
                      <small className="muted">
                        {i.category}
                        {i.expires && ` · Best before ${i.expires}`}
                      </small>
                    </div>
                    <div className="row">
                      <button
                        className="secondary small"
                        aria-label={`Decrease ${i.name}`}
                        disabled={busy || i.quantity <= 1}
                        onClick={() =>
                          act(() =>
                            mutate(i.id, (old) =>
                              validateItem({
                                ...old,
                                quantity: old.quantity - 1,
                              }),
                            ),
                          )
                        }
                      >
                        −
                      </button>
                      <span aria-label={`${i.name} quantity`}>
                        {i.quantity}
                      </span>
                      <button
                        className="secondary small"
                        aria-label={`Increase ${i.name}`}
                        disabled={busy || i.quantity >= 9999}
                        onClick={() =>
                          act(() =>
                            mutate(i.id, (old) =>
                              validateItem({
                                ...old,
                                quantity: old.quantity + 1,
                              }),
                            ),
                          )
                        }
                      >
                        +
                      </button>
                      <button
                        className="secondary small"
                        disabled={busy}
                        onClick={() => act(() => mutate(i.id, () => null))}
                      >
                        Remove<span className="sr-only"> {i.name}</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
            <hr className="divider" />
            <button
              disabled={busy || !ready || !items.length}
              onClick={() =>
                act(async () => {
                  const d = await api("/api/recipes", {
                    items: items.map(({ name, quantity }) => ({
                      name,
                      quantity,
                    })),
                  });
                  setRecipes(d.recipes);
                  setRecipeMode(d.mode);
                })
              }
            >
              Find something to cook ↗
            </button>
          </section>
          <aside className="panel">
            <p className="eyebrow">Make some room</p>
            <h2>Add an ingredient</h2>
            <form onSubmit={add} className="stack">
              <label>
                Ingredient
                <input
                  required
                  maxLength={80}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Brown rice"
                />
              </label>
              <div className="row">
                <label style={{ flex: 1 }}>
                  Quantity
                  <input
                    required
                    type="number"
                    min="1"
                    max="9999"
                    step="1"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                  />
                </label>
                <label style={{ flex: 2 }}>
                  Category
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    {["Produce", "Grains", "Dairy", "Protein", "Other"].map(
                      (c) => (
                        <option key={c}>{c}</option>
                      ),
                    )}
                  </select>
                </label>
              </div>
              <label>
                Best before (optional)
                <input
                  type="date"
                  value={form.expires}
                  onChange={(e) =>
                    setForm({ ...form, expires: e.target.value })
                  }
                />
              </label>
              <Button
                type="submit"
                variant="contained"
                disabled={busy || !ready}
              >
                Add to pantry
              </Button>
              <label>
                Identify from a photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  disabled={busy}
                  onChange={(e) => photo(e.target.files[0])}
                />
              </label>
              <small className="muted">
                Gemini suggests a name; review it before adding. Photos are sent
                for analysis and are not stored.
              </small>
              {image && (
                <img
                  className="image-preview"
                  src={image}
                  alt="Ingredient to identify"
                />
              )}
            </form>
          </aside>
        </div>
        {recipes && (
          <section style={{ marginTop: 32 }}>
            <div className="row between">
              <h2>Tonight, from your pantry</h2>
              <span className="badge">
                {recipeMode === "demo"
                  ? "Curated demo recipes"
                  : "Gemini suggestions"}
              </span>
            </div>
            <div className="grid">
              {recipes.map((r) => (
                <article className="card" key={r.title}>
                  <h3>{r.title}</h3>
                  <p>{r.description}</p>
                  <p>
                    <strong>You have:</strong> {r.used.join(", ")}
                  </p>
                  <p>
                    <strong>Also needed:</strong>{" "}
                    {r.missing.join(", ") || "Nothing else"}
                  </p>
                  <ol>
                    {r.steps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
      <footer className="site-footer">
        Headstarter project 02 · Built to make the everyday a little easier.
      </footer>
    </>
  );
}
