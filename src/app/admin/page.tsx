
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  createCourthouse,
  deactivateCourthouse,
  updateCourthouse,
  reactivateCourthouse,
} from './actions';
import styles from './Admin.module.css';

type AdminPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

const successMessages: Record<string, string> = {
  created: 'Courthouse created and address verified successfully.',
  updated: 'Courthouse updated and address verified successfully.',
  deactivated: 'Courthouse deactivated successfully.',
  reactivated: 'Courthouse reactivated successfully.',
};

const errorMessages: Record<string, string> = {
  unauthorized: 'You are not authorized to access the admin panel.',
  invalid_address:
    'The address could not be verified. Please check it and try again.',
  geocoding_failed:
    'We could not verify the address. Please try again.',
  create_failed: 'Could not create the courthouse. Please try again.',
  update_failed: 'Could not update the courthouse. Please try again.',
  deactivate_failed: 'Could not deactivate the courthouse. Please try again.',
  reactivate_failed: 'Could not reactivate the courthouse. Please try again.',
};

export default async function AdminPage({
  searchParams,
}: AdminPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { claims },
  } = await supabase.auth.getClaims();

  if (!claims) {
    redirect('/login');
  }

  const userId = claims.sub;

  const { data: userRole } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (!userRole) {
    redirect('/login?error=unauthorized');
  }

  const { data: courthouses, error: courthouseError } = await supabase
    .from('courthouse_locations')
    .select(
      'id, name, address, latitude, longitude, active, created_at'
    )
    .order('name', { ascending: true });

  if (courthouseError) {
    console.error('Failed to load courthouse locations:', courthouseError);
  }

  const locations = courthouses ?? [];
  const activeCount = locations.filter((location) => location.active).length;
  const inactiveCount = locations.length - activeCount;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <Link href="/" className={styles.backLink}>
              ← View public locator
            </Link>

            <span className={styles.adminBadge}>
              <span className={styles.adminBadgeDot} />
              Administrator
            </span>
          </div>

          <div className={styles.headerContent}>
            <div>
              <p className={styles.eyebrow}>COURTHOUSE LOCATOR</p>
              <h1 className={styles.title}>Admin Dashboard</h1>
              <p className={styles.subtitle}>
                Manage courthouse locations, verify addresses, and control
                which courthouses appear in public search results.
              </p>
            </div>
          </div>
        </header>

        {params.success && successMessages[params.success] && (
          <div className={styles.alertSuccess} role="status">
            <span className={styles.alertIcon} aria-hidden="true">
              ✓
            </span>
            {successMessages[params.success]}
          </div>
        )}

        {params.error && (
          <div className={styles.alertError} role="alert">
            <span className={styles.alertIcon} aria-hidden="true">
              !
            </span>
            {errorMessages[params.error] ??
              'Something went wrong. Please check your information and try again.'}
          </div>
        )}

        {courthouseError && (
          <div className={styles.alertError} role="alert">
            Courthouse locations could not be loaded. Please refresh the page.
          </div>
        )}

        <section className={styles.statsGrid} aria-label="Courthouse summary">
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total locations</div>
            <div className={styles.statValue}>{locations.length}</div>
            <div className={styles.statDescription}>
              All courthouse records
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Active locations</div>
            <div className={styles.statValue}>{activeCount}</div>
            <div className={styles.statDescription}>
              Available in public search
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statLabel}>Inactive locations</div>
            <div className={styles.statValue}>{inactiveCount}</div>
            <div className={styles.statDescription}>
              Hidden from public search
            </div>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.eyebrow}>NEW LOCATION</p>
              <h2 className={styles.panelTitle}>Add a courthouse</h2>
              <p className={styles.panelDescription}>
                Add a courthouse using its official name and street address.
                The address will be verified before it is saved.
              </p>
            </div>
            <span className={styles.sectionNumber}>01</span>
          </div>

          <form action={createCourthouse} className={styles.createForm}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label htmlFor="new-name" className={styles.label}>
                  Courthouse name
                </label>
                <input
                  id="new-name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Stanley Mosk Courthouse"
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="new-address" className={styles.label}>
                  Street address
                </label>
                <input
                  id="new-address"
                  name="address"
                  type="text"
                  required
                  placeholder="e.g. 111 N Hill St, Los Angeles, CA"
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.formFooter}>
              <p className={styles.helperText}>
                Use a complete address so the location can be accurately
                verified.
              </p>
              <button type="submit" className={styles.primaryButton}>
                <span aria-hidden="true">+</span> Add courthouse
              </button>
            </div>
          </form>
        </section>

        <section className={styles.locationsSection}>
          <div className={styles.locationsHeader}>
            <div>
              <p className={styles.eyebrow}>LOCATION DIRECTORY</p>
              <h2 className={styles.panelTitle}>Manage courthouses</h2>
              <p className={styles.panelDescription}>
                Edit courthouse details or change whether a location appears
                in public search results.
              </p>
            </div>

            <span className={styles.countBadge}>
              {locations.length} {locations.length === 1 ? 'location' : 'locations'}
            </span>
          </div>

          {locations.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon} aria-hidden="true">
                ⌖
              </div>
              <h3>No courthouse locations yet</h3>
              <p>
                Add your first courthouse using the form above.
              </p>
            </div>
          ) : (
            <div className={styles.locationList}>
              {locations.map((courthouse, index) => (
                <article
                  key={courthouse.id}
                  className={styles.locationCard}
                >
                  <div className={styles.locationCardHeader}>
                    <div className={styles.locationIdentity}>
                      <span className={styles.locationIndex}>
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <div className={styles.locationHeading}>
                        <h3 className={styles.locationName}>
                          {courthouse.name}
                        </h3>
                        <p className={styles.locationAddress}>
                          {courthouse.address}
                        </p>
                      </div>
                    </div>

                    <span
                      className={
                        courthouse.active
                          ? styles.statusActive
                          : styles.statusInactive
                      }
                    >
                      <span className={styles.statusDot} />
                      {courthouse.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className={styles.locationDetails}>
                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Latitude</span>
                      <span className={styles.detailValue}>
                        {courthouse.latitude ?? 'Not set'}
                      </span>
                    </div>

                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Longitude</span>
                      <span className={styles.detailValue}>
                        {courthouse.longitude ?? 'Not set'}
                      </span>
                    </div>

                    <div className={styles.detailItem}>
                      <span className={styles.detailLabel}>Added</span>
                      <span className={styles.detailValue}>
                        {courthouse.created_at
                          ? new Date(courthouse.created_at).toLocaleDateString(
                              'en-US',
                              {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              }
                            )
                          : 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <form
                    action={updateCourthouse}
                    className={styles.editForm}
                  >
                    <input
                      type="hidden"
                      name="id"
                      value={courthouse.id}
                    />

                    <div className={styles.formGrid}>
                      <div className={styles.field}>
                        <label
                          htmlFor={`name-${courthouse.id}`}
                          className={styles.label}
                        >
                          Courthouse name
                        </label>
                        <input
                          id={`name-${courthouse.id}`}
                          name="name"
                          type="text"
                          required
                          defaultValue={courthouse.name}
                          className={styles.input}
                        />
                      </div>

                      <div className={styles.field}>
                        <label
                          htmlFor={`address-${courthouse.id}`}
                          className={styles.label}
                        >
                          Street address
                        </label>
                        <input
                          id={`address-${courthouse.id}`}
                          name="address"
                          type="text"
                          required
                          defaultValue={courthouse.address}
                          className={styles.input}
                        />
                      </div>
                    </div>

                    <div className={styles.locationActions}>
                      <button
                        type="submit"
                        className={styles.primaryButton}
                      >
                        Save changes
                      </button>
                    </div>
                  </form>

                  <div className={styles.statusActions}>
                    {courthouse.active ? (
                      <form action={deactivateCourthouse}>
                        <input
                          type="hidden"
                          name="id"
                          value={courthouse.id}
                        />
                        <button
                          type="submit"
                          className={styles.secondaryButton}
                        >
                          Deactivate
                        </button>
                      </form>
                    ) : (
                      <form action={reactivateCourthouse}>
                        <input
                          type="hidden"
                          name="id"
                          value={courthouse.id}
                        />
                        <button
                          type="submit"
                          className={styles.reactivateButton}
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

        <footer className={styles.footer}>
          <span>Courthouse Locator</span>
          <span>Administrative dashboard</span>
        </footer>
      </div>
    </main>
  );
}
