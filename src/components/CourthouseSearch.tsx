
'use client';

import { FormEvent, useState } from 'react';
import CourthouseMap, {
  CourthouseMapLocation,
} from '@/components/CourthouseMap';
import styles from '@/app/CourthouseLocator.module.css';

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
        headers: { 'Content-Type': 'application/json' },
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
        err instanceof Error ? err.message : 'Search failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }

  const mapCourthouses: CourthouseMapLocation[] = searched
    ? results
    : initialCourthouses;

  const cards = searched ? results : [];

  return (
    <div className={styles.searchExperience}>
      <div className={styles.mapRegion}>
        <CourthouseMap
          key={searched ? `${searchCenter?.lat},${searchCenter?.lng}` : 'initial'}
          courthouses={mapCourthouses}
          searchCenter={searchCenter}
        />
      </div>

      <section className={styles.searchPanel} aria-label="Find a courthouse">
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <button
            type="submit"
            className={styles.searchIconButton}
            disabled={loading}
            aria-label="Search courthouses"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" />
              <path d="m16 16 4.2 4.2" stroke="currentColor" />
            </svg>
          </button>

          <label htmlFor="courthouse-address" className={styles.visuallyHidden}>
            Enter your address, city, or ZIP code
          </label>

          <input
            id="courthouse-address"
            type="text"
            autoComplete="street-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Enter Your Address..."
            maxLength={200}
            className={styles.searchInput}
          />

          {address && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={() => {
                setAddress('');
                setError('');
              }}
              aria-label="Clear address"
            >
              ×
            </button>
          )}
        </form>

        {!searched && !loading && !error && (
        <p className={styles.searchInstruction}>
            Enter your address, city, or ZIP code to find the nearest courthouse.
        </p>
        )}

        {loading && (
          <p className={styles.statusMessage} role="status">
            Searching for nearby courthouses…
          </p>
        )}

        {error && (
          <p className={styles.errorMessage} role="alert">
            {error}
          </p>
        )}
      </section>

      {searched && (
        <aside
          className={styles.resultsPanel}
          aria-label="Courthouse results"
          aria-live="polite"
        >
          {searched && (
            <p className={styles.resultsSummary}>
              {results.length === 0
                ? 'No nearby courthouses are available in our current directory.'
                : `${results.length} ${results.length === 1 ? 'court' : 'courts'} found`}
            </p>
          )}

          {cards.length === 0 ? (
            <p className={styles.emptyState}>
              We don't have a courthouse listed for this search yet.
            </p>
          ) : (
            <div className={styles.cardList}>
              {cards.map((courthouse, index) => {
                const destination =
                  courthouse.latitude != null &&
                  courthouse.longitude != null
                    ? `${courthouse.latitude},${courthouse.longitude}`
                    : courthouse.address;

                const directionsUrl = searchCenter
                  ? `https://www.google.com/maps/dir/?api=1&origin=${searchCenter.lat},${searchCenter.lng}&destination=${encodeURIComponent(destination)}`
                  : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;

                const distance =
                  'distanceMiles' in courthouse
                    ? courthouse.distanceMiles
                    : null;

                return (
                  <article
                    key={courthouse.id}
                    className={`${styles.courthouseCard} ${
                      index === 0 ? styles.featuredCard : styles.compactCard
                    }`}
                  >
                    <div className={styles.photoPlaceholder} aria-hidden="true">
                      <svg
                        viewBox="0 0 48 48"
                        width="38"
                        height="38"
                        fill="none"
                      >
                        <path
                          d="M6 18 24 7l18 11M10 20h28M13 20v17m7-17v17m8-17v17m7-17v17M8 39h32"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <div className={styles.cardBody}>
                      {index === 0 && (
                        <p className={styles.cardEyebrow}>
                          {searched ? 'Closest court' : 'Courthouse'}
                        </p>
                      )}

                      <h2 className={styles.cardTitle}>{courthouse.name}</h2>

                      {distance != null && (
                        <p className={styles.cardDistance}>
                          {distance.toFixed(1)} mi away
                        </p>
                      )}

                      <p className={styles.cardAddress}>{courthouse.address}</p>

                      <a
                        href={directionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.directionsButton}
                      >
                        Get Directions
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
