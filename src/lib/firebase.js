import { browser } from '$app/environment';

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

let app;
let auth;
let db;
let storage;

if (browser) {
    const firebaseConfig = {
        apiKey: "AIzaSyDZInQAT04ZcUWk69m28KuCG_j_-90Ry3w",
        authDomain: "giggle-69420.firebaseapp.com",
        projectId: "giggle-69420",
        storageBucket: "giggle-69420.firebasestorage.app",
        messagingSenderId: "237116485084",
        appId: "1:237116485084:web:16636132f11882aef37319"
    };
    
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
}

export { app, auth, db, storage };
