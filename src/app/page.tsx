
import CourthouseMap from '@/components/CourthouseMap';
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

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">
              Courthouse locations
            </h2>

            {!error && (
              <p className="mt-2 text-slate-600">
                {courthouses?.length ?? 0}{' '}
                {(courthouses?.length ?? 0) === 1
                  ? 'location'
                  : 'locations'}{' '}
                available
              </p>
            )}
          </div>

          {error ? (
            <p role="alert" className="text-red-700">
              Courthouse locations could not be loaded. Please try again later.
            </p>
          ) : (
            <>
              <div className="mb-8">
                <CourthouseMap courthouses={courthouses ?? []} />
              </div>

              {courthouses && courthouses.length > 0 ? (
                <ul className="divide-y divide-slate-200">
                  {courthouses.map((courthouse) => (
                    <li
                      key={courthouse.id}
                      className="py-5 first:pt-0 last:pb-0"
                    >
                      <h3 className="text-lg font-semibold text-slate-900">
                        {courthouse.name}
                      </h3>

                      <p className="mt-1 text-slate-600">
                        {courthouse.address}
                      </p>

                      {courthouse.latitude != null &&
                        courthouse.longitude != null && (
                          <a
                            className="mt-3 inline-block text-sm font-medium text-blue-700 hover:text-blue-900"
                            href={`https://www.google.com/maps/search/?api=1&query=${courthouse.latitude},${courthouse.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View on Google Maps
                          </a>
                        )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-600">
                  No active courthouse locations are available yet.
                </p>
              )}
            </>
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
