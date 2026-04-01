
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDWoJIFjESoOvt-B9-rb0If4ZjlH0l8hyE",
    authDomain: "envibase-platform-prod.firebaseapp.com",
    projectId: "envibase-platform-prod",
    storageBucket: "envibase-platform-prod.firebasestorage.app",
    messagingSenderId: "822595259938",
    appId: "1:822595259938:web:c025ed4adb55a61007847b"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
