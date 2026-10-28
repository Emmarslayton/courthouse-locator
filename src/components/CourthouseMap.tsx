
'use client';

import { useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
} from '@vis.gl/react-google-maps';

export type CourthouseMapLocation = {
  id: string | number;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

type CourthouseMapProps = {
  courthouses: CourthouseMapLocation[];
  searchCenter?: {
    lat: number;
    lng: number;
  } | null;
};

const DEFAULT_CENTER = { lat: 34.0549, lng: -118.2436 };

export default function CourthouseMap({
  courthouses,
  searchCenter = null,
}: CourthouseMapProps) {
  const [selectedId, setSelectedId] = useState<string | number | null>(
    null
  );

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  const mappableCourthouses = courthouses.filter(
    (courthouse) =>
      typeof courthouse.latitude === 'number' &&
      typeof courthouse.longitude === 'number'
  );

  const selectedCourthouse = mappableCourthouses.find(
    (courthouse) => courthouse.id === selectedId
  );

  return (
    <section className="space-y-3">

      {!apiKey ? (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">
          Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local, then restart
          the development server.
        </p>
      ) : (
        <APIProvider apiKey={apiKey}>
          <div
            style={{
                height: '420px',
                width: '100%',
                overflow: 'hidden',
                borderRadius: '0.75rem',
                border: '1px solid #cbd5e1',
            }}
            >
            <Map
            center={searchCenter ?? DEFAULT_CENTER}
            defaultZoom={9}
            mapId="DEMO_MAP_ID"
            gestureHandling="greedy"
            style={{ width: '100%', height: '100%' }}
            >
              {mappableCourthouses.map((courthouse) => (
                <AdvancedMarker
                  key={courthouse.id}
                  position={{
                    lat: courthouse.latitude!,
                    lng: courthouse.longitude!,
                  }}
                  title={courthouse.name}
                  onClick={() => setSelectedId(courthouse.id)}
                />
              ))}

              {selectedCourthouse && (
                <InfoWindow
                  position={{
                    lat: selectedCourthouse.latitude!,
                    lng: selectedCourthouse.longitude!,
                  }}
                  onClose={() => setSelectedId(null)}
                >
                  <div className="max-w-64 p-1">
                    <h3 className="font-semibold">
                      {selectedCourthouse.name}
                    </h3>
                    <p className="mt-1 text-sm">
                      {selectedCourthouse.address}
                    </p>
                    <a
                      className="mt-2 inline-block text-sm font-medium text-blue-700"
                      href={`https://www.google.com/maps/search/?api=1&query=${selectedCourthouse.latitude},${selectedCourthouse.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Directions
                    </a>
                  </div>
                </InfoWindow>
              )}
            </Map>
          </div>
        </APIProvider>
      )}

      <p className="text-sm text-slate-500">
        Showing {mappableCourthouses.length} mapped{' '}
        {mappableCourthouses.length === 1 ? 'courthouse' : 'courthouses'}.
      </p>
    </section>
  );
}
