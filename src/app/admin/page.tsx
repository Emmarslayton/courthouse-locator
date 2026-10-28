
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
    createCourthouse,
    deactivateCourthouse,
    updateCourthouse,
    reactivateCourthouse,
} from './actions';

type AdminPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (authError || !userId) {
    redirect('/login');
  }

  const { data: role, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (roleError) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <h1 className="text-2xl font-bold text-slate-900">
          Unable to verify administrator access
        </h1>
        <p className="mt-3 text-slate-600">
          Please try again later.
        </p>
      </main>
    );
  }

  if (!role) {
    redirect('/login?error=unauthorized');
  }

  const { data: courthouses, error: courthousesError } = await supabase
    .from('courthouse_locations')
    .select('id, name, address, latitude, longitude, active, created_at')
    .order('name');

  const messages: Record<string, string> = {
    required: 'Enter both a courthouse name and an address.',
    save: 'The change could not be saved. Please try again.',
    invalid: 'The courthouse request was invalid.',
    notfound: 'The courthouse was not found or is already inactive.',
    geocode:
      'Google could not verify this address. Check the street address, city, state, and ZIP code, then try again.',
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="text-sm font-medium text-blue-700 hover:text-blue-800"
        >
          ← Courthouse Locator
        </Link>

        <header className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            Courthouse management
          </h1>
          <p className="mt-3 text-slate-600">
            Add courthouse locations and manage their availability.
          </p>
        </header>

        {params.success === 'created' && (
          <p role="status" className="mt-6 rounded-lg bg-green-50 p-4 text-green-800">
            Courthouse created successfully.
          </p>
        )}

        {params.success === 'deactivated' && (
          <p role="status" className="mt-6 rounded-lg bg-green-50 p-4 text-green-800">
            Courthouse deactivated successfully.
          </p>
        )}

        {params.success === 'created' && (
            <p
              role="status"
              className="mt-6 rounded-lg bg-green-50 p-4 text-green-800"
            >
              Courthouse created and address verified successfully.
            </p>
          )}

          {params.success === 'updated' && (
            <p
              role="status"
              className="mt-6 rounded-lg bg-green-50 p-4 text-green-800"
            >
              Courthouse updated and address verified successfully.
            </p>
          )}

        {params.error && (
          <p role="alert" className="mt-6 rounded-lg bg-red-50 p-4 text-red-800">
            {messages[params.error] ?? 'Something went wrong. Please try again.'}
          </p>
        )}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Add a courthouse
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Enter the courthouse name and its street address.
          </p>

          <form action={createCourthouse} className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Courthouse name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                maxLength={150}
                placeholder="e.g. Denver Distribution Center"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Street address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                required
                maxLength={300}
                placeholder="Street, city, state, ZIP"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
              >
                Add courthouse
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-900">
              Courthouse locations
            </h2>
            <span className="text-sm text-slate-500">
              {courthouses?.length ?? 0} total
            </span>
          </div>

          {courthousesError ? (
            <p role="alert" className="mt-5 text-red-700">
              Unable to load courthouse records. Check the database connection
              and permissions.
            </p>
          ) : !courthouses || courthouses.length === 0 ? (
            <p className="mt-5 text-slate-600">
              No courthouse locations yet. Use the form above to add your first
              location.
            </p>
          ) : (
            <div className="mt-6 divide-y divide-slate-200">
              {courthouses.map((courthouse) => (
                <article
                key={courthouse.id}
                className="py-6"
                >
                <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-semibold text-slate-900">
                    {courthouse.name}
                    </h3>

                    <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        courthouse.active
                        ? 'bg-green-50 text-green-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                    >
                    {courthouse.active ? 'Active' : 'Inactive'}
                    </span>
                </div>

                <form
                    action={updateCourthouse}
                    className="mt-4 grid gap-4 sm:grid-cols-2"
                >
                    <input type="hidden" name="id" value={courthouse.id} />

                    <div>
                    <label
                        htmlFor={`name-${courthouse.id}`}
                        className="mb-1 block text-sm font-medium text-slate-700"
                    >
                        Courthouse name
                    </label>
                    <input
                        id={`name-${courthouse.id}`}
                        name="name"
                        type="text"
                        required
                        maxLength={150}
                        defaultValue={courthouse.name}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                    />
                    </div>

                    <div>
                    <label
                        htmlFor={`address-${courthouse.id}`}
                        className="mb-1 block text-sm font-medium text-slate-700"
                    >
                        Address
                    </label>
                    <input
                        id={`address-${courthouse.id}`}
                        name="address"
                        type="text"
                        required
                        maxLength={300}
                        defaultValue={courthouse.address}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                    />
                    </div>

                    <div className="sm:col-span-2">
                    <p className="mb-3 text-xs text-slate-500">
                        Coordinates:{' '}
                        {courthouse.latitude != null && courthouse.longitude != null
                        ? `${courthouse.latitude}, ${courthouse.longitude}`
                        : 'Not geocoded yet'}
                    </p>

                    <div className="flex flex-wrap gap-3">
                        <button
                        type="submit"
                        className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                        >
                        Save changes
                        </button>
                    </div>
                    </div>
                </form>

                <div className="mt-3">
                    {courthouse.active ? (
                    <form action={deactivateCourthouse}>
                        <input type="hidden" name="id" value={courthouse.id} />
                        <button
                        type="submit"
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                        Deactivate
                        </button>
                    </form>
                    ) : (
                    <form action={reactivateCourthouse}>
                        <input type="hidden" name="id" value={courthouse.id} />
                        <button
                        type="submit"
                        className="rounded-lg border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                        >
                        Reactivate
                        </button>
                    </form>
                    )}
                </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
