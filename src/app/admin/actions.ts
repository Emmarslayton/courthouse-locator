'use server';

import { geocodeAddress } from '@/lib/google/geocode';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function getOptionalUrl(value: FormDataEntryValue | null): string | null {
  const url = String(value ?? '').trim();

  if (!url) {
    return null;
  }

  if (url.length > 2048) {
    return null;
  }

  try {
    const parsed = new URL(url);

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function isValidOptionalUrl(value: FormDataEntryValue | null): boolean {
  const raw = String(value ?? '').trim();
  return raw === '' || getOptionalUrl(raw) !== null;
}

async function requireAdmin() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || !userId) {
    redirect('/login');
  }

  const { data: role, error: roleError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (roleError || !role) {
    redirect('/?error=unauthorized');
  }

  return supabase;
}

export async function createCourthouse(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const address = String(formData.get('address') ?? '').trim();
  const imageUrlInput = formData.get('image_url');
  const websiteUrlInput = formData.get('website_url');

  if (
    !name ||
    !address ||
    name.length > 150 ||
    address.length > 300 ||
    !isValidOptionalUrl(imageUrlInput) ||
    !isValidOptionalUrl(websiteUrlInput)
  ) {
    redirect('/admin?error=invalid');
  }

  const image_url = getOptionalUrl(imageUrlInput);
  const website_url = getOptionalUrl(websiteUrlInput);

  const supabase = await requireAdmin();

  let geocoded: Awaited<ReturnType<typeof geocodeAddress>>;

  try {
    geocoded = await geocodeAddress(address);
  } catch (error) {
    console.error(
      'Failed to geocode courthouse address:',
      error instanceof Error ? error.message : 'Unknown error'
    );

    redirect('/admin?error=geocode');
  }

  const { error } = await supabase.from('courthouse_locations').insert({
    name,
    address,
    image_url,
    website_url,
    latitude: geocoded.latitude,
    longitude: geocoded.longitude,
    google_place_id: geocoded.placeId,
    geocoded_at: new Date().toISOString(),
    active: true,
  });

  if (error) {
    console.error('Failed to create courthouse:', error.message);
    redirect('/admin?error=save');
  }

  revalidatePath('/admin');
  revalidatePath('/');
  redirect('/admin?success=created');
}

export async function deactivateCourthouse(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();

  if (!id) {
    redirect('/admin?error=invalid');
  }

  const supabase = await requireAdmin();

  const { data, error } = await supabase
    .from('courthouse_locations')
    .update({ active: false })
    .eq('id', id)
    .eq('active', true)
    .select('id');

  if (error) {
    console.error('Failed to deactivate courthouse:', error.message);
    redirect('/admin?error=save');
  }

  if (!data || data.length === 0) {
    redirect('/admin?error=notfound');
  }

  revalidatePath('/admin');
  revalidatePath('/');
  redirect('/admin?success=deactivated');
}

export async function updateCourthouse(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const address = String(formData.get('address') ?? '').trim();
  const imageUrlInput = formData.get('image_url');
  const websiteUrlInput = formData.get('website_url');

  if (
    !id ||
    !name ||
    !address ||
    name.length > 150 ||
    address.length > 300 ||
    !isValidOptionalUrl(imageUrlInput) ||
    !isValidOptionalUrl(websiteUrlInput)
  ) {
    redirect('/admin?error=invalid');
  }

  const image_url = getOptionalUrl(imageUrlInput);
  const website_url = getOptionalUrl(websiteUrlInput);

  const supabase = await requireAdmin();

  // Verify the address before updating the record.
  let geocoded: Awaited<ReturnType<typeof geocodeAddress>>;

  try {
    geocoded = await geocodeAddress(address);
  } catch (error) {
    console.error(
      'Failed to geocode updated courthouse address:',
      error instanceof Error ? error.message : 'Unknown error'
    );

    redirect('/admin?error=geocode');
  }

  const { data, error } = await supabase
    .from('courthouse_locations')
    .update({
      name,
      address,
      image_url,
      website_url,
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
      google_place_id: geocoded.placeId,
      geocoded_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id');

  if (error) {
    console.error('Failed to update courthouse:', error.message);
    redirect('/admin?error=save');
  }

  if (!data || data.length === 0) {
    redirect('/admin?error=notfound');
  }

  revalidatePath('/admin');
  revalidatePath('/');
  redirect('/admin?success=updated');
}

export async function reactivateCourthouse(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();

  if (!id) {
    redirect('/admin?error=invalid');
  }

  const supabase = await requireAdmin();

  const { data, error } = await supabase
    .from('courthouse_locations')
    .update({ active: true })
    .eq('id', id)
    .eq('active', false)
    .select('id');

  if (error) {
    console.error('Failed to reactivate courthouse:', error.message);
    redirect('/admin?error=save');
  }

  if (!data || data.length === 0) {
    redirect('/admin?error=notfound');
  }

  revalidatePath('/admin');
  revalidatePath('/');
  redirect('/admin?success=reactivated');
}
