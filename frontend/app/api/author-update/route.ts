import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

const authToken = process.env.NEXT_PUBLIC_DUMMY_KEY || "demo-key";
const auth = `Token ${authToken}`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { authorId, name } = body || {};
    if (!authorId || !name) {
      return NextResponse.json({ error: "Missing authorId or name" }, { status: 400 });
    }

    await fetch(`http://backend:8000/home/api/authors/${authorId}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth,
      },
      body: JSON.stringify({ name }),
    });

    revalidatePath("/server-action-demo");

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
