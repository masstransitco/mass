// components/BackButton.jsx

import React from "react";
import "./Button.css"; // Ensure this imports your CSS

const BackButton = ({ onClick }) => (
  <button className="back-button" onClick={onClick} aria-label="Go Back">
    ←
  </button>
);

export default BackButton;
