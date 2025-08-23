import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDo_inKLrA6iSpiHQHen-DUZ_6KYz64TwA",
  authDomain: "datasync-dc3b6.firebaseapp.com",
  projectId: "datasync-dc3b6",
  storageBucket: "datasync-dc3b6.firebasestorage.app",
  messagingSenderId: "554540503021",
  appId: "1:554540503021:web:2101e4a725a507a1d221e4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);