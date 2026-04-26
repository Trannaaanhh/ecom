export type CustomerSession = {
  token: string;
  user: {
    name: string;
    email: string;
  };
};

export type CustomerCheckoutProfile = {
  name: string;
  phone: string;
  email: string;
  address: string;
  note: string;
};

const CUSTOMER_SESSION_KEY = 'ecommerge_customer_session';
const CUSTOMER_CHECKOUT_PROFILE_KEY = 'ecommerge_customer_checkout_profile';

export function getCustomerSession(): CustomerSession | null {
  const raw = localStorage.getItem(CUSTOMER_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CustomerSession;
    if (!parsed?.token || !parsed?.user?.name || !parsed?.user?.email) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setCustomerSession(session: CustomerSession) {
  localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
}

export function clearCustomerSession() {
  localStorage.removeItem(CUSTOMER_SESSION_KEY);
}

export function getCustomerCheckoutProfile(): CustomerCheckoutProfile | null {
  const raw = localStorage.getItem(CUSTOMER_CHECKOUT_PROFILE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as CustomerCheckoutProfile;
    if (!parsed) {
      return null;
    }

    return {
      name: parsed.name ?? '',
      phone: parsed.phone ?? '',
      email: parsed.email ?? '',
      address: parsed.address ?? '',
      note: parsed.note ?? '',
    };
  } catch {
    return null;
  }
}

export function setCustomerCheckoutProfile(profile: CustomerCheckoutProfile) {
  localStorage.setItem(CUSTOMER_CHECKOUT_PROFILE_KEY, JSON.stringify(profile));
}

export function clearCustomerCheckoutProfile() {
  localStorage.removeItem(CUSTOMER_CHECKOUT_PROFILE_KEY);
}
