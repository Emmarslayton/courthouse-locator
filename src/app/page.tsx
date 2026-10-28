
import CourthouseMap from '@/components/CourthouseMap';
import CourthouseSearch from '@/components/CourthouseSearch';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();

  const { data: courthouses, error } = await supabase
    .from('courthouse_locations')
    .select('id, name, address, latitude, longitude')
    .eq('active', true)
    .order('name');

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            Courthouse Locator
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Find the right courthouse.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            Explore courthouse locations to help identify where to file your case.
          </p>
        </header>

        <section>
          {error ? (
            <p role="alert" className="text-red-700">
              Courthouse locations could not be loaded. Please try again later.
            </p>
          ) : (
            <CourthouseSearch initialCourthouses={courthouses ?? []} />
          )}
        </section>

        <footer className="mt-8">
          <Link
            href="/admin"
            className="text-sm font-medium text-blue-700 hover:text-blue-900"
          >
            Admin area
          </Link>
        </footer>
      </div>
    </main>
  );
}
