// components/ViewBar.jsx

import React from "react";
import "./ViewBar.css"; // Ensure this imports your CSS

const ViewBar = ({ stationName }) => (
  <div className="view-bar">
    <span>{stationName}</span>
  </div>
);

export default ViewBar;
