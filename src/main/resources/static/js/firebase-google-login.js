import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDRgewveDLIoBDgnuEydFJD6N1YsC97aJw",
  authDomain: "eventease-961bf.firebaseapp.com",
  projectId: "eventease-961bf",
  storageBucket: "eventease-961bf.firebasestorage.app",
  messagingSenderId: "87186222472",
  appId: "1:87186222472:web:61bcf92f2f765b98b7de3d",
  measurementId: "G-MVZE3YYWN6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const button = document.getElementById("googleLoginBtn");
const errorElement = document.getElementById("googleLoginError");

if (button) {
  button.addEventListener("click", async () => {
    if (button.disabled) return;

    button.disabled = true;
    if (errorElement) errorElement.textContent = "";

    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const csrfToken =
        document.querySelector('meta[name="_csrf"]')?.content;

      const csrfHeader =
        document.querySelector('meta[name="_csrf_header"]')?.content;

      if (!csrfToken || !csrfHeader) {
        throw new Error("Security token missing. Refresh the page.");
      }

      const response = await fetch("/auth/firebase/google", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          [csrfHeader]: csrfToken
        },
        body: JSON.stringify({ idToken })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Google login failed");
      }

      await signOut(auth);
      window.location.replace(data.redirect || "/");

    } catch (error) {
      console.error("Google login error:", error);

      if (errorElement) {
        errorElement.textContent =
          error.message || "Google sign-in failed";
      }
    } finally {
      button.disabled = false;
    }
  });
}