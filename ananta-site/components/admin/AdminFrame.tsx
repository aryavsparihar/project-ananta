'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { ADMIN_NAV, ROLE_LABEL, isAdminRole, type AdminRole } from '@/lib/admin';
import styles from './Admin.module.css';

type Admin = { userId: string; email: string; role: AdminRole };

const AdminContext = createContext<Admin | null>(null);

/** The signed-in organiser. Only available inside <AdminFrame>. */
export function useAdmin(): Admin {
  const admin = useContext(AdminContext);
  if (!admin) throw new Error('useAdmin() must be used inside <AdminFrame>.');
  return admin;
}

/**
 * Wraps every /admin page except the sign-in: confirms the session and role
 * once (the middleware already did, this is for the UI), then draws the admin
 * bar and hands the role to the page.
 */
export function AdminFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSignIn = pathname === '/admin';
  const [admin, setAdmin] = useState<Admin | null>(null);

  useEffect(() => {
    if (isSignIn) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          window.location.replace('/admin?login=1');
          return;
        }
        const { data: role, error } = await supabase.rpc('current_admin_role');
        if (error || !isAdminRole(role)) {
          window.location.replace('/admin?access=denied');
          return;
        }
        if (!cancelled) setAdmin({ userId: user.id, email: user.email ?? '', role });
      } catch {
        window.location.replace('/admin?error=config');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignIn]);

  if (isSignIn) return <>{children}</>;

  async function signOut() {
    await createClient().auth.signOut();
    window.location.replace('/admin');
  }

  if (!admin) {
    return (
      <div className="shell">
        <p className={styles.loading}>Verifying organiser access…</p>
      </div>
    );
  }

  const links = ADMIN_NAV.filter((item) => item.roles.includes(admin.role));

  return (
    <AdminContext.Provider value={admin}>
      <div className={styles.bar}>
        <div className={styles.barInner}>
          <nav aria-label="Admin" className={styles.nav}>
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={styles.navLink}
                aria-current={pathname.startsWith(item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className={styles.who}>
            <span className="meta">
              {admin.email} · {ROLE_LABEL[admin.role]}
            </span>
            <button type="button" className={styles.ghost} onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </div>
      {children}
    </AdminContext.Provider>
  );
}
