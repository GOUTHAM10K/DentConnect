import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBvbRc4lGl3frOZO6xlgX5VYBKXybsDqm4",
  authDomain: "dentconnect-73638.firebaseapp.com",
  projectId: "dentconnect-73638",
  storageBucket: "dentconnect-73638.firebasestorage.app",
  messagingSenderId: "133660210570",
  appId: "1:133660210570:web:6ee929538a3b631ae4473"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { GoogleAuthProvider, signInWithCredential };
export default app;
