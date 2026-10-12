import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/blogger',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/devstorage.read_write',
];

const provider = new GoogleAuthProvider();
OAUTH_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
// Request account selection with admin hint
provider.setCustomParameters({
  prompt: 'select_account',
  login_hint: 'dr.panditkale@gmail.com',
});

// Flag to indicate ongoing sign-in flow
let isSigningIn = false;

// Cache access token in-memory with session-scoped fallback so reloads don't drop OAuth session
const SESSION_TOKEN_KEY = 'blogger_oauth_access_token';
let cachedAccessToken: string | null = (typeof window !== 'undefined' ? window.sessionStorage?.getItem(SESSION_TOKEN_KEY) : null);

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (!cachedAccessToken && typeof window !== 'undefined') {
        cachedAccessToken = window.sessionStorage?.getItem(SESSION_TOKEN_KEY);
      }
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (typeof window !== 'undefined') {
        window.sessionStorage?.removeItem(SESSION_TOKEN_KEY);
      }
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve Google OAuth access token from credential');
    }

    cachedAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      window.sessionStorage?.setItem(SESSION_TOKEN_KEY, credential.accessToken);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  if (!cachedAccessToken && typeof window !== 'undefined') {
    cachedAccessToken = window.sessionStorage?.getItem(SESSION_TOKEN_KEY);
  }
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      window.sessionStorage?.setItem(SESSION_TOKEN_KEY, token);
    } else {
      window.sessionStorage?.removeItem(SESSION_TOKEN_KEY);
    }
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } finally {
    cachedAccessToken = null;
    if (typeof window !== 'undefined') {
      window.sessionStorage?.removeItem(SESSION_TOKEN_KEY);
    }
  }
};

export const getFirebaseMetadata = () => {
  return {
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId,
    authDomain: firebaseConfig.authDomain,
    storageBucket: firebaseConfig.storageBucket,
    oAuthClientId: firebaseConfig.oAuthClientId,
  };
};
