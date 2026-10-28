type GeocodingResult = {
  latitude: number;
  longitude: number;
  placeId: string;
  county: string | null;
};

type GoogleGeocodingResponse = {
  status: string;
  error_message?: string;
  results?: Array<{
    place_id: string;
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
};


export async function geocodeAddress(
  address: string
): Promise<GeocodingResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error('Google Maps API key is not configured.');
  }

  const normalizedAddress = address.trim();

  if (!normalizedAddress) {
    throw new Error('A warehouse address is required.');
  }

  const url = new URL(
    'https://maps.googleapis.com/maps/api/geocode/json'
  );

  url.searchParams.set('address', normalizedAddress);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('region', 'us');

  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error('Google Geocoding service is unavailable.');
  }

  const result =
    (await response.json()) as GoogleGeocodingResponse;

  if (result.status !== 'OK' || !result.results?.length) {
    if (result.status === 'ZERO_RESULTS') {
      throw new Error('Google could not find this address.');
    }

    console.error('Geocoding failed:', result.status);
    throw new Error('Unable to verify this address.');
  }

  const match = result.results[0];
  const { lat, lng } = match.geometry.location;

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    throw new Error('Google returned invalid coordinates.');
  }


  const countyComponent = match.address_components.find((component) =>
    component.types.includes('administrative_area_level_2')
  );

  return {
    latitude: lat,
    longitude: lng,
    placeId: match.place_id,
    county: countyComponent?.long_name ?? null,
  };

}
