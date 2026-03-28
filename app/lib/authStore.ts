type AdminAccount = {
  email: string;
  password: string;
};

type AdminSession = {
  loggedIn: boolean;
  email: string;
};

const ADMIN_ACCOUNT_KEY = 'mi-tienda:adminAccount';
const ADMIN_SESSION_KEY = 'mi-tienda:adminSession';

const DEFAULT_ADMIN: AdminAccount = {
  email: 'admin@imisports.com',
  password: 'admin123',
};

function ensureDefaultAdmin() {
  if (typeof window === 'undefined') return;
  const raw = window.localStorage.getItem(ADMIN_ACCOUNT_KEY);
  if (!raw) {
    window.localStorage.setItem(ADMIN_ACCOUNT_KEY, JSON.stringify(DEFAULT_ADMIN));
  }
}

export function loadAdminAccount(): AdminAccount {
  if (typeof window === 'undefined') return DEFAULT_ADMIN;
  ensureDefaultAdmin();

  const raw = window.localStorage.getItem(ADMIN_ACCOUNT_KEY);
  if (!raw) return DEFAULT_ADMIN;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_ADMIN;

    const record = parsed as Record<string, unknown>;
    const email = record.email;
    const password = record.password;

    if (typeof email !== 'string' || typeof password !== 'string') return DEFAULT_ADMIN;
    return { email, password };
  } catch {
    return DEFAULT_ADMIN;
  }
}

export function saveAdminAccount(account: AdminAccount) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ADMIN_ACCOUNT_KEY, JSON.stringify(account));
}

export function loginAdmin(email: string, password: string): boolean {
  const admin = loadAdminAccount();
  const ok = admin.email === email && admin.password === password;
  if (!ok) return false;

  const session: AdminSession = { loggedIn: true, email };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  }
  return true;
}

export function logoutAdmin() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const record = parsed as Record<string, unknown>;
    const loggedIn = record.loggedIn;
    const email = record.email;

    if (!loggedIn || typeof email !== 'string') return null;
    return { loggedIn: true, email };
  } catch {
    return null;
  }
}

