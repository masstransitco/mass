// src/components/Map/LocateMe.jsx

import React from "react";
import "./Button.css"; // Ensure this path is correct
import { FaLocationArrow } from "react-icons/fa"; // Icon from react-icons

const LocateMe = ({ onLocateMe }) => {
  return (
    <button className="locate-me-button" onClick={onLocateMe} title="Locate Me">
      <FaLocationArrow />
    </button>
  );
};

export default LocateMe;
