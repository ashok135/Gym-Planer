import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyADhWJF5oFMnJTs3Vz8vtlanErJPEa0K6o",
    authDomain: "gym-planer-f1d6c.firebaseapp.com",
    projectId: "gym-planer-f1d6c",
    storageBucket: "gym-planer-f1d6c.firebasestorage.app",
    messagingSenderId: "388737417348",
    appId: "1:388737417348:web:3f0625f3d57fde9aaa42d1",
    measurementId: "G-NTFMHGSVG7"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
