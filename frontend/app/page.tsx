import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">Doc Studio</h1>
        <p className="text-xl text-muted-foreground mb-8">
          AI-Powered Document Editor
        </p>
        <p className="text-muted-foreground mb-8">
          Upload, edit, and enhance your documents with AI assistance.
          Support for Word documents with intelligent editing features.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 border border-border rounded-lg hover:bg-secondary transition"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}
