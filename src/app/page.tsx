
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            Courthouse Locator
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Find the right courthouse.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Search to identify your closest courthouse to file your case.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Courthouse search
          </h2>

          <p className="mt-2 text-slate-600">
            Courthouse locations will appear here once the search and map
            features are connected.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="rounded-lg bg-blue-700 px-5 py-3 font-medium text-white hover:bg-blue-800"
            >
              Admin area
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
