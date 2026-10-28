
import CourthouseSearch from '@/components/CourthouseSearch';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import styles from './CourthouseLocator.module.css';

export default async function Home() {
  const supabase = await createClient();

  const { data: courthouses, error } = await supabase
    .from('courthouse_locations')
    .select('id, name, address, latitude, longitude')
    .eq('active', true)
    .order('name');

  return (
    <main className={styles.locator}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>Court Filing Locator</h1>
            <p className={styles.subtitle}>
              Enter your address below to find which court you should file at.
            </p>
          </div>

          <Link href="/admin" className={styles.employeeLogin}>
            Employee Login
          </Link>
        </div>
      </header>

      <section className={styles.workspace}>
        {error ? (
          <p role="alert" className={styles.error}>
            Courthouse locations could not be loaded. Please try again later.
          </p>
        ) : (
          <CourthouseSearch
            initialCourthouses={courthouses ?? []}
          />
        )}
      </section>
    </main>
  );
}
