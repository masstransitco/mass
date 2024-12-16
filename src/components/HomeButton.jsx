// components/HomeButton.jsx

import React from "react";
import "./Button.css"; // Ensure this imports your CSS

const HomeButton = ({ onClick }) => (
  <button className="home-button" onClick={onClick} aria-label="Go Home">
    🏠
  </button>
);

export default HomeButton;
