// src/components/Map/ChooseDestinationButton.jsx

import React from "react";
import { FaArrowRight } from "react-icons/fa";
import "./ChooseDestinationButton.css"; // Ensure to create appropriate styles

const ChooseDestinationButton = ({ onChooseDestination }) => {
  return (
    <button
      className="choose-destination-button"
      onClick={onChooseDestination}
      aria-label="Choose Destination"
    >
      Continue to select destination <FaArrowRight />
    </button>
  );
};

export default React.memo(ChooseDestinationButton);
