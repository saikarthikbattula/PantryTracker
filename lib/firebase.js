import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  runTransaction,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
export const cloudEnabled = Boolean(
  config.apiKey && config.projectId && config.appId && config.authDomain,
);
export function services() {
  const app = getApps()[0] || initializeApp(config);
  return { auth: getAuth(app), db: getFirestore(app) };
}
export async function login() {
  return signInWithPopup(services().auth, new GoogleAuthProvider());
}
export async function logout() {
  await signOut(services().auth);
}
export function observeAuth(callback, onError) {
  return onAuthStateChanged(services().auth, callback, onError);
}
export async function ensureUser() {
  const { auth } = services();
  await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser;
  return (await signInAnonymously(auth)).user;
}
export function watchItems(uid, onItems, onError) {
  return onSnapshot(
    collection(services().db, "users", uid, "pantry"),
    (s) => onItems(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  );
}
export async function changeItem(uid, id, update) {
  const ref = doc(services().db, "users", uid, "pantry", id);
  await runTransaction(services().db, async (tx) => {
    const snap = await tx.get(ref);
    const next = update(snap.exists() ? { id: snap.id, ...snap.data() } : null);
    if (next) tx.set(ref, next);
    else tx.delete(ref);
  });
}
export async function saveFeedback(uid, id, data) {
  await setDoc(doc(services().db, "users", uid, "feedback", id), data);
}
