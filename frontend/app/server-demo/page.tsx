export default async function ServerDemo() {
  const res = await fetch("http://backend:8000/home/api/books/", {
    cache: "no-store",
    headers: {
      Authorization: `Token ${process.env.NEXT_PUBLIC_DUMMY_KEY}`,
      Accept: "application/json",
    },
  });
  const data = await res.json();
  const books = data.results || [];
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-96 p-8 bg-white rounded-lg shadow">
        <h1 className="text-center text-xl font-bold mb-4">Server Demo</h1>
        <ul className="mb-4">
          {books.map(
            (book: { id: number; title: string; author: { name: string } }, idx: number) => (
              <li key={book.id ?? idx}>
                <strong>{book.title}</strong> by {book.author.name}
              </li>
            )
          )}
        </ul>
        <p className="text-sm text-gray-600">Fetched on the server. User data is never exposed to the browser network tab.</p>
      </div>
    </div>
  );
}
