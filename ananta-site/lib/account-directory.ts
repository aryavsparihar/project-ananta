import type { AdminRole } from './admin';

export type AuthDirectoryUser = {
  id: string;
  email?: string | null;
  created_at: string;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
  last_sign_in_at?: string | null;
};

export type RegistrationDirectoryRow = {
  user_id: string | null;
  participant_email: string | null;
  participant_name: string | null;
  entry_number: string | null;
  submitted_at: string | null;
  imported_at: string;
  source: 'website' | 'google_forms';
};

export type AdminDirectoryRow = {
  user_id: string;
  role: AdminRole;
  is_active: boolean;
};

export type AccountDirectoryEntry = {
  email: string;
  createdAt: string;
  emailConfirmedAt: string | null;
  lastSignInAt: string | null;
  registrationStatus: 'registered' | 'not_registered';
  registrationDate: string | null;
  registrationSource: 'website' | 'google_forms' | null;
  participantName: string | null;
  entryNumber: string | null;
  adminRole: AdminRole | null;
  adminActive: boolean | null;
};

function registrationTime(row: RegistrationDirectoryRow): number {
  const parsed = Date.parse(row.submitted_at ?? row.imported_at);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function keepNewest(
  index: Map<string, RegistrationDirectoryRow>,
  key: string,
  candidate: RegistrationDirectoryRow,
) {
  const prior = index.get(key);
  if (!prior || registrationTime(candidate) > registrationTime(prior)) {
    index.set(key, candidate);
  }
}

/**
 * Joins private Auth metadata to registration status without exposing auth IDs.
 * Website registrations match by Auth user ID; legacy Google Form imports,
 * which predate student accounts, match by their verified email address.
 */
export function buildAccountDirectory(
  users: AuthDirectoryUser[],
  registrations: RegistrationDirectoryRow[],
  admins: AdminDirectoryRow[],
  includeAdminAccounts: boolean,
): AccountDirectoryEntry[] {
  const registrationByUser = new Map<string, RegistrationDirectoryRow>();
  const importedRegistrationByEmail = new Map<string, RegistrationDirectoryRow>();

  for (const row of registrations) {
    if (row.user_id) {
      keepNewest(registrationByUser, row.user_id, row);
    } else if (row.source === 'google_forms') {
      const email = row.participant_email?.trim().toLowerCase();
      if (email) keepNewest(importedRegistrationByEmail, email, row);
    }
  }

  const roleByUser = new Map(
    admins.map((row) => [
      row.user_id,
      { role: row.role, isActive: Boolean(row.is_active) },
    ]),
  );

  return users
    .filter((user) => includeAdminAccounts || !roleByUser.has(user.id))
    .map((user) => {
      const email = user.email?.trim().toLowerCase() ?? '';
      const registration =
        registrationByUser.get(user.id) ?? importedRegistrationByEmail.get(email);
      const admin = roleByUser.get(user.id);
      const registrationStatus: AccountDirectoryEntry['registrationStatus'] = registration
        ? 'registered'
        : 'not_registered';

      return {
        email: user.email ?? '',
        createdAt: user.created_at,
        emailConfirmedAt: user.email_confirmed_at ?? user.confirmed_at ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
        registrationStatus,
        registrationDate: registration
          ? (registration.submitted_at ?? registration.imported_at)
          : null,
        registrationSource: registration?.source ?? null,
        participantName: registration?.participant_name ?? null,
        entryNumber: registration?.entry_number ?? null,
        adminRole: admin?.role ?? null,
        adminActive: admin?.isActive ?? null,
      };
    })
    .sort((a, b) => {
      const aTime = a.lastSignInAt ?? a.createdAt;
      const bTime = b.lastSignInAt ?? b.createdAt;
      return bTime.localeCompare(aTime);
    });
}
