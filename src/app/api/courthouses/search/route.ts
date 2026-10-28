
import { NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/google/geocode';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Courthouse = {
  id: string | number;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  website_url: string | null;
};

function calculateDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const earthRadiusMiles = 3958.8;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const latitudeDifference = toRadians(lat2 - lat1);
  const longitudeDifference = toRadians(lon2 - lon1);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(longitudeDifference / 2) ** 2;

  const centralAngle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMiles * centralAngle;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== 'object' ||
      !('address' in body) ||
      typeof body.address !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Enter an address, city, or ZIP code.' },
        { status: 400 }
      );
    }

    const address = body.address.trim();

    if (!address || address.length > 200) {
      return NextResponse.json(
        { error: 'Enter a valid address, city, or ZIP code.' },
        { status: 400 }
      );
    }

    const location = await geocodeAddress(address);

    if (location.county !== 'Los Angeles County') {
      return NextResponse.json(
        {
          error:
            'Please enter an address, city, or ZIP code within Los Angeles County, California.',
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('courthouse_locations')
      .select(
        'id, name, address, latitude, longitude, image_url, website_url'
      )
      .eq('active', true);

    if (error) {
      console.error('Courthouse search database error:', error.message);

      return NextResponse.json(
        { error: 'Courthouse locations could not be loaded.' },
        { status: 500 }
      );
    }

    const courthouses = (data ?? []) as Courthouse[];

    const results = courthouses
      .filter(
        (
          courthouse
        ): courthouse is Courthouse & {
          latitude: number;
          longitude: number;
        } =>
          typeof courthouse.latitude === 'number' &&
          Number.isFinite(courthouse.latitude) &&
          typeof courthouse.longitude === 'number' &&
          Number.isFinite(courthouse.longitude)
      )
      .map((courthouse) => ({
        ...courthouse,
        distanceMiles: calculateDistanceMiles(
          location.latitude,
          location.longitude,
          courthouse.latitude,
          courthouse.longitude
        ),
      }))
      .sort((a, b) => a.distanceMiles - b.distanceMiles)
      .slice(0, 10)
      .map((courthouse) => ({
        ...courthouse,
        distanceMiles: Math.round(courthouse.distanceMiles * 10) / 10,
      }));

    return NextResponse.json({
      searchedAddress: address,
      searchLocation: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      results,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected search error.';

    if (
      message.includes('could not find') ||
      message.includes('Unable to verify') ||
      message.includes('Unable to geocode')
    ) {
      return NextResponse.json(
        {
          error:
            'We could not find that location. Check the address or ZIP code and try again.',
        },
        { status: 400 }
      );
    }

    console.error('Courthouse search failed:', message);

    return NextResponse.json(
      {
        error:
          'The courthouse search is temporarily unavailable. Please try again.',
      },
      { status: 500 }
    );
  }
}
