
'use client';

import { FormEvent, useState } from 'react';
import CourthouseMap, {
  CourthouseMapLocation,
} from '@/components/CourthouseMap';
import styles from '@/app/CourthouseLocator.module.css';

type SearchResult = CourthouseMapLocation & {
  distanceMiles: number;
  image_url?: string | null;
  website_url?: string | null;
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
  const [activeMenuId, setActiveMenuId] = useState<string | number | null>(
    null
  );
  const [copiedId, setCopiedId] = useState<string | number | null>(null);
  const [copyError, setCopyError] = useState('');

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!address.trim()) {
      setError('Enter an address, city, or ZIP code.');
      return;
    }

    setLoading(true);
    setError('');
    setSearched(false);
    setActiveMenuId(null);
    setCopiedId(null);
    setCopyError('');

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

  async function copyAddress(
    id: string | number,
    courthouseAddress: string
  ) {
    try {
      await navigator.clipboard.writeText(courthouseAddress);
      setCopiedId(id);
      setCopyError('');
    } catch {
      setCopyError(
        'Could not copy automatically. Please select and copy the address.'
      );
      setCopiedId(null);
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
          key={
            searched
              ? `${searchCenter?.lat},${searchCenter?.lng}`
              : 'initial'
          }
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
          <p className={styles.resultsSummary}>
            {results.length === 0
              ? 'No nearby courthouses are available in our current directory.'
              : `${results.length} ${results.length === 1 ? 'court' : 'courts'} found`}
          </p>

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

                                    const isMenuOpen = activeMenuId === courthouse.id;
                                    const isCopied = copiedId === courthouse.id;

                                    return (
                                    <article
                                        key={courthouse.id}
                                        className={`${styles.courthouseCard} ${
                                        index === 0 ? styles.featuredCard : styles.compactCard
                                        }`}
                                    >
                                        <div className={styles.photoPlaceholder}>
                                        {courthouse.image_url ? (
                    <img
                        src={courthouse.image_url}
                        alt={`${courthouse.name} courthouse`}
                        className={styles.courthouseImage}
                        onError={(event) => {
                        event.currentTarget.style.display = 'none';

                        const fallback = event.currentTarget
                            .nextElementSibling as HTMLElement | null;

                        if (fallback) {
                            fallback.style.display = 'flex';
                        }
                        }}
                    />
                    ) : null}

                    <div
                    className={styles.courthouseImageFallback}
                    style={{
                        display: courthouse.image_url ? 'none' : 'flex',
                    }}
                    aria-label="Courthouse image unavailable"
                    >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M3 21h18" />
                        <path d="M5 21V8l7-5 7 5v13" />
                        <path d="M9 21v-6h6v6" />
                        <path d="M9 10h.01M15 10h.01" />
                    </svg>
                    </div>
                    </div>

                    <div className={styles.cardBody}>
                      {index === 0 && (
                        <p className={styles.cardEyebrow}>Closest court</p>
                      )}

                      <h2 className={styles.cardTitle}>{courthouse.name}</h2>

                      <p className={styles.cardDistance}>
                        {courthouse.distanceMiles.toFixed(1)} mi away
                      </p>

                      <p className={styles.cardAddress}>{courthouse.address}</p>

                      {courthouse.website_url && (
                        <a
                          href={courthouse.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.websiteLink}
                        >
                          Official Website ↗
                        </a>
                      )}

                      <div className={styles.cardActionRow}>
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.directionsButton}
                        >
                          Get Directions
                        </a>

                        <button
                          type="button"
                          className={styles.moreActionsButton}
                          aria-label={`More actions for ${courthouse.name}`}
                          aria-expanded={isMenuOpen}
                          aria-haspopup="dialog"
                          onClick={() => {
                            setActiveMenuId(
                              isMenuOpen ? null : courthouse.id
                            );
                            setCopiedId(null);
                            setCopyError('');
                          }}
                        >
                          ...
                        </button>
                      </div>

                      {isMenuOpen && (
                        <div
                          className={styles.menuOverlay}
                          role="presentation"
                          onClick={() => setActiveMenuId(null)}
                        >
                          <section
                            className={styles.actionMenu}
                            role="dialog"
                            aria-modal="true"
                            aria-label={`Actions for ${courthouse.name}`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className={styles.actionMenuHeader}>
                              <h3>{courthouse.name}</h3>
                              <button
                                type="button"
                                className={styles.closeMenuButton}
                                aria-label="Close actions"
                                onClick={() => setActiveMenuId(null)}
                              >
                                ×
                              </button>
                            </div>

                            <p className={styles.actionMenuAddress}>
                              {courthouse.address}
                            </p>

                            <button
                              type="button"
                              className={styles.menuActionButton}
                              onClick={() =>
                                copyAddress(
                                  courthouse.id,
                                  courthouse.address
                                )
                              }
                            >
                              {isCopied ? '✓ Address copied' : 'Copy address'}
                            </button>

                            {copyError && (
                              <p className={styles.menuError} role="alert">
                                {copyError}
                              </p>
                            )}

                            <a
                              href={directionsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.menuActionButton}
                              onClick={() => setActiveMenuId(null)}
                            >
                              Get directions ↗
                            </a>

                            <button
                              type="button"
                              className={styles.menuDoneButton}
                              onClick={() => setActiveMenuId(null)}
                            >
                              Done
                            </button>
                          </section>
                        </div>
                      )}
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
