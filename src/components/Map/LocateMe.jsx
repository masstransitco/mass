import React, { useState } from "react";
import PropTypes from "prop-types";
import "./Button.css";
import { FaLocationArrow, FaSpinner } from "react-icons/fa";

const LocateMe = ({ onLocateMe }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      await onLocateMe();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className="locate-me-button"
      onClick={handleClick}
      title="Locate Me"
      aria-label="Locate Me"
      disabled={isLoading}
    >
      {isLoading ? <FaSpinner className="spinner" /> : <FaLocationArrow />}
    </button>
  );
};

LocateMe.propTypes = {
  onLocateMe: PropTypes.func.isRequired,
};

export default LocateMe;
