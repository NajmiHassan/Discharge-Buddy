import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// supabase-js surfaces a bare "Failed to fetch" when the browser never reaches
// the auth server (offline, ad blocker, DNS/VPN filtering). Say that instead.
function describeAuthError(message: string | undefined): string | null {
  if (!message) return null;
  if (/failed to fetch|network ?error|load failed/i.test(message)) {
    return "Can't reach the server. Check your internet connection, and disable any ad blocker or VPN that may be blocking supabase.co.";
  }
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return { error: describeAuthError(error.message), needsConfirmation: false };
    }

    // When the email is already registered, GoTrue does NOT error — it returns an
    // obfuscated stand-in user (random id, empty `identities`) so the endpoint can't
    // be used to enumerate accounts. The password is left untouched, so reporting
    // success here is what makes the next sign-in fail with "Invalid login
    // credentials". Treat the empty identities array as "already registered".
    if (data.user && data.user.identities?.length === 0) {
      return {
        error:
          "This email is already registered. Switch to Sign In — and use Forgot password if you don't remember it. Signing up again does not change the password.",
        needsConfirmation: false,
      };
    }

    // No session means the project requires email confirmation before sign-in.
    return { error: null, needsConfirmation: data.session === null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: describeAuthError(error?.message) };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}