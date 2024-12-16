import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import "./GoogleSignIn.css";

const GoogleSignIn = () => {
  const { auth } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const handleSignIn = () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        console.log("User signed in:", result.user);
      })
      .catch((error) => {
        alert("Error signing in: " + error.message);
        console.error("Error signing in:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <button
      className="google-signin-button"
      onClick={handleSignIn}
      disabled={loading}
      aria-label="Sign in with Google"
    >
      {loading ? "Signing in..." : "Sign in with Google"}
    </button>
  );
};

export default GoogleSignIn;
