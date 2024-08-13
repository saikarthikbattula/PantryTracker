import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
const firebaseConfig = {
 apiKey: "AIzaSyBCZ7Btrqgv1BtJ1rNg6n2cdhcUVYSDDwY",
 authDomain: "pantry-b46b9.firebaseapp.com",
 projectId: "pantry-b46b9",
 storageBucket: "pantry-b46b9.appspot.com",
 messagingSenderId: "875944013351",
 appId: "1:875944013351:web:beb14aee8d6d60eaf7e802"
 };
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
export { firestore };