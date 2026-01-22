"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

type User = { name: string };

export default function ClientActionDemo() {
  const [name, setName] = useState("");
  const [authorId, setAuthorId] = useState("3");
  const authToken = process.env.NEXT_PUBLIC_DUMMY_KEY || "demo-key";
  const auth = `Token ${authToken}`;

  useEffect(() => {
    if (!authorId) return;
    fetch(`http://localhost:8000/home/api/authors/${authorId}/`, {
      headers: { Authorization: auth },
    })
      .then((res) => res.json())
  }, [authorId]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!authorId) return;
    await fetch(`http://localhost:8000/home/api/authors/${authorId}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body: JSON.stringify({ name }),
    });
    setName("");
    const updated = await fetch(`http://localhost:8000/home/api/authors/${authorId}/`, {
      headers: { Authorization: auth },
    }).then(res => res.json());
  }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96 p-8">
          <h1 className="text-center text-xl font-bold mb-4">Client Action Demo</h1>
          <div className="mb-4">
            <label className="flex items-center gap-2">
              Author ID:
              <input
                type="number"
                value={authorId}
                onChange={e => setAuthorId(e.target.value)}
                className="w-16 ml-2 border rounded px-2 py-1"
                min={1}
              />
            </label>
          </div>
          {/* <div>User: {user ? user.name : "Loading..."}</div> */}
          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="New name" className="border rounded px-2 py-1" />
            <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">Update Name</button>
          </form>
        </Card>
      </div>
    );
}
