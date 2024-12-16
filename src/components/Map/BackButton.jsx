// src/components/Map/BackButton.jsx

import React from "react";
import { FaArrowLeft } from "react-icons/fa"; // Importing Back (Left Arrow) icon
import "./Button.css"; // Import the CSS for styling

const BackButton = ({ onClick }) => (
  <button
    className="back-button"
    onClick={onClick}
    aria-label="Go Back"
    title="Go Back"
  >
    <FaArrowLeft size={20} />
  </button>
);

export default BackButton;
