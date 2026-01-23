import { signOut } from "firebase/auth";
import { auth } from "./firebase.js";

document.getElementById("logoutBtn")?.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "/login.html";
  });
});
