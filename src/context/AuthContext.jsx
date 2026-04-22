import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  sendEmailVerification,
  updatePassword,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading,     setLoading]     = useState(true);

  const login    = (email, pass) => signInWithEmailAndPassword(auth, email, pass);

  const register = async (email, pass) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await sendEmailVerification(cred.user);
    return cred;
  };

  /**
   * Google sign-in — popup first, redirect fallback.
   * Returns the UserCredential on success, null if redirect was used.
   */
  const loginWithGoogle = async () => {
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const blocked = [
        "auth/popup-blocked",
        "auth/popup-cancelled-by-user",
        "auth/cancelled-popup-request",
      ];
      if (blocked.includes(err.code)) {
        await signInWithRedirect(auth, googleProvider);
        return null;
      }
      throw err;
    }
  };

  /**
   * Check if an email already has an account in Firebase.
   * Returns true if any sign-in method is registered for that email.
   */
  const emailExists = async (email) => {
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return methods.length > 0;
    } catch {
      return false;
    }
  };

  /**
   * After Google sign-in on Register: add email+password to the Google account
   * so the user has both providers linked.
   */
  const linkEmailPassword = async (pass) => {
    const cred = EmailAuthProvider.credential(auth.currentUser.email, pass);
    return linkWithCredential(auth.currentUser, cred);
  };

  const logout         = ()      => signOut(auth);
  const updateName     = (name)  => updateProfile(auth.currentUser, { displayName: name });
  const changePassword = (pass)  => updatePassword(auth.currentUser, pass);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Catch Google redirect result after page reload
  useEffect(() => {
    getRedirectResult(auth).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser,
      login, register, loginWithGoogle,
      logout, updateName, changePassword,
      emailExists, linkEmailPassword,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}