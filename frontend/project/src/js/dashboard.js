import { auth } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";

onAuthStateChanged(auth, (user) => {
  if (user) {
    const el = document.getElementById("userEmail");
    if (el) el.textContent = user.email;
  }
});
