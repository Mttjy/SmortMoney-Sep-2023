import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBIsGKDLXSX147t9-SUkN4Jueb9K8He73U",
    authDomain: "smortmoney.firebaseapp.com",
    projectId: "smortmoney",
    storageBucket: "smortmoney.appspot.com",
    messagingSenderId: "1044440496874",
    appId: "1:1044440496874:web:89431bd1a1754c914b3593",
    measurementId: "G-6WJY8KMPX6"
};

export const FIREBASE_APP = initializeApp(firebaseConfig)
export const FIRESTORE_DB = getFirestore(FIREBASE_APP)
export const FIREBASE_AUTH = getAuth(FIREBASE_APP)
export const FIREBASE_STORAGE = getStorage(FIREBASE_APP)
// For more information on how to access Firebase in your project,
// see the Firebase documentation: https://firebase.google.com/docs/web/setup#access-firebase
