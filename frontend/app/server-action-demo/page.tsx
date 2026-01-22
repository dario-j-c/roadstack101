import { revalidatePath } from "next/cache";
import { Card } from "@/components/ui/card";


const authToken = process.env.NEXT_PUBLIC_DUMMY_KEY || "demo-key";
const auth = `Token ${authToken}`;

async function getAuthor(authorId: string) {
  const res = await fetch(`http://backend:8000/home/api/authors/${authorId}/`, {
    cache: "no-store",
    headers: { Authorization: auth },
  });
  return res.json();
}

async function updateAuthor(formData: FormData) {
  "use server";
  const name = formData.get("name");
  const authorId = formData.get("authorId") as string;
  await fetch(`http://backend:8000/home/api/authors/${authorId}/`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: JSON.stringify({ name }),
  });
  revalidatePath("/server-action-demo");
}

export default async function Page() {

  const defaultAuthorId = "3";

  const author = await getAuthor(defaultAuthorId);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-96 p-8">
        <h1 className="text-center text-xl font-bold mb-4">Server Action Demo</h1>
        <div className="mb-4">Author: {author.name}</div>
        <form action={updateAuthor} className="mt-5 flex flex-col gap-2">
          <label className="flex items-center gap-2">
            Author ID:
            <input name="authorId" defaultValue={defaultAuthorId} className="w-16 ml-2 border rounded px-2 py-1" min={1} type="number" />
          </label>
          <input name="name" placeholder="New name" className="border rounded px-2 py-1" />
          <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700">Update Name</button>
        </form>
      </Card>
    </div>
  );
}
