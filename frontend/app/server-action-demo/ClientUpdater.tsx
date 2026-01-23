"use client";

import { useState } from "react";

export default function ClientUpdater({ defaultAuthorId = "3" }: { defaultAuthorId?: string }) {
  const [name, setName] = useState("");
  const [authorId, setAuthorId] = useState(defaultAuthorId);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/author-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorId, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data?.error || "Request failed");
      } else {
        setMsg("Updated");
      }
    } catch (err) {
      setMsg(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2">
      <label className="flex items-center gap-2">
        Author ID:
        <input value={authorId} onChange={(e) => setAuthorId(e.target.value)} className="w-16 ml-2 border rounded px-2 py-1" min={1} type="number" />
      </label>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New name" className="border rounded px-2 py-1" />
      <button type="submit" disabled={loading} className="bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700">
        {loading ? "Updating..." : "Update from Client"}
      </button>
      <div>{msg}</div>
    </form>
  );
}
