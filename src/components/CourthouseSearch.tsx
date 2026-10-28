
'use client';

import { FormEvent, useState } from 'react';
import CourthouseMap, {
  CourthouseMapLocation,
} from '@/components/CourthouseMap';

type SearchResult = CourthouseMapLocation & {
  distanceMiles: number;
};

type SearchResponse = {
  searchedAddress: string;
  searchLocation: {
    latitude: number;
    longitude: number;
  };
  results: SearchResult[];
  error?: string;
};

export default function CourthouseSearch({
  initialCourthouses,
}: {
  initialCourthouses: CourthouseMapLocation[];
}) {
  const [address, setAddress] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchCenter, setSearchCenter] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!address.trim()) {
      setError('Enter an address, city, or ZIP code.');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(false);

    try {
      const response = await fetch('/api/courthouses/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: address.trim() }),
      });

      const data = (await response.json()) as SearchResponse;

      if (!response.ok) {
        throw new Error(data.error || 'Search failed. Please try again.');
      }

      setResults(data.results);
      setSearchCenter({
        lat: data.searchLocation.latitude,
        lng: data.searchLocation.longitude,
      });
      setSearched(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Search failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  const mapCourthouses: CourthouseMapLocation[] = searched
    ? results
    : initialCourthouses;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-semibold text-slate-900">
          Find a courthouse near you
        </h2>

        <p className="mt-2 text-slate-600">
          Search by street address, city, or ZIP code.
        </p>

        <form
          onSubmit={handleSearch}
          className="mt-6 flex flex-col gap-3 sm:flex-row"
        >
          <label htmlFor="courthouse-address" className="sr-only">
            Address, city, or ZIP code
          </label>

          <input
            id="courthouse-address"
            type="text"
            autoComplete="street-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Enter an address or ZIP code"
            maxLength={200}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Searching…' : 'Find courthouses'}
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}
      </section>

      {searched && (
        <section aria-live="polite" className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Nearby courthouses
            </h2>
            <p className="mt-2 text-slate-600">
              {results.length === 0
                ? 'No nearby courthouses are available in our current directory. We are expanding our coverage.'
                : `${results.length} ${results.length === 1 ? 'courthouse' : 'courthouses'} found, sorted by distance.`}
            </p>
          </div>

          {results.length > 0 && (
            <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white px-5">
              {results.map((courthouse) => (
                <li key={courthouse.id} className="py-5">
                  <h3 className="font-semibold text-slate-900">
                    {courthouse.name}
                  </h3>
                  <p className="mt-1 text-slate-600">
                    {courthouse.address}
                  </p>
                  <p className="mt-2 text-sm font-medium text-blue-700">
                    {courthouse.distanceMiles.toFixed(1)} miles away
                  </p>
                  <a
                    className="mt-2 inline-block text-sm font-medium text-blue-700 hover:text-blue-900"
                    href={`https://www.google.com/maps/dir/?api=1&origin=${searchCenter?.lat},${searchCenter?.lng}&destination=${courthouse.latitude},${courthouse.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Get directions
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-4 text-2xl font-semibold text-slate-900">
          {searched ? 'Courthouse map' : 'Explore courthouse locations'}
        </h2>
        <CourthouseMap
          key={searched ? `${searchCenter?.lat},${searchCenter?.lng}` : 'initial'}
          courthouses={mapCourthouses}
          searchCenter={searchCenter}
        />
      </section>
    </div>
  );
}
