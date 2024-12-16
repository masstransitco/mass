//src/context/AuthContext.jsx

import React, { createContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { auth } from "../services/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

// Create the Context
export const AuthContext = createContext();

// Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // New loading state

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setLoading(false); // Stop loading after determining the auth state
      },
      (error) => {
        console.error("Error during auth state change:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const logout = () => {
    signOut(auth)
      .then(() => {
        console.log("User signed out.");
        setUser(null); // Ensure UI updates immediately
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        auth,
        logout,
        loading, // Expose loading state
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
