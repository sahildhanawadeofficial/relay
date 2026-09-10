import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center flex flex-col gap-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight">ChatBot Platform</h1>
        <p className="text-xl text-gray-500 max-w-2xl">
          Build custom AI chatbots for your data in minutes. Upload documents and get instant answers with citations.
        </p>
        <div className="flex gap-4 mt-8">
          <Link 
            href="/login" 
            className="rounded-md bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition"
          >
            Log In
          </Link>
          <Link 
            href="/register" 
            className="rounded-md bg-white border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Register
          </Link>
        </div>
      </div>
    </main>
  );
}
