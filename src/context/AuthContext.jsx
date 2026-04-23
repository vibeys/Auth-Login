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

  // Popup first, redirect fallback
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
   * SAFE account-existence check.
   *
   * fetchSignInMethodsForEmail is DEPRECATED in Firebase JS SDK v9+ and
   * returns [] even for real accounts — causing the old code to wrongly
   * delete users.  We never call it.
   *
   * Instead we inspect the providerData that Firebase already gives us on
   * the signed-in user object after the Google popup/redirect resolves.
   *
   * hasPasswordLinked(user)  → true if the user completed Register
   *                             (email+password provider is linked)
   * hasGoogleLinked(user)    → true if google.com provider is linked
   */
  const hasPasswordLinked = (user) =>
    !!user?.providerData.some((p) => p.providerId === "password");

  const hasGoogleLinked = (user) =>
    !!user?.providerData.some((p) => p.providerId === "google.com");

  /**
   * After Google sign-in on Register:
   * link an email+password credential to the Google account.
   */
  const linkEmailPassword = async (pass) => {
    const cred = EmailAuthProvider.credential(auth.currentUser.email, pass);
    return linkWithCredential(auth.currentUser, cred);
  };

  const logout         = ()     => signOut(auth);
  const updateName     = (name) => updateProfile(auth.currentUser, { displayName: name });
  const changePassword = (pass) => updatePassword(auth.currentUser, pass);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    getRedirectResult(auth).catch(() => {});
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser,
      login,
      register,
      loginWithGoogle,
      logout,
      updateName,
      changePassword,
      hasPasswordLinked,
      hasGoogleLinked,
      linkEmailPassword,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}