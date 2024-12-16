// src/components/Map/HomeButton.jsx

import React from "react";
import { FaHome } from "react-icons/fa"; // Importing Home icon
import "./Button.css"; // Import the CSS for styling

const HomeButton = ({ onClick }) => (
  <button
    className="home-button"
    onClick={onClick}
    aria-label="Go Home"
    title="Go Home"
  >
    <FaHome size={20} />
  </button>
);

export default HomeButton;
