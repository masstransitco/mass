import React, { useState, useEffect, memo } from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import EV5 from "./EV5";
import EV7 from "./EV7";
import Taxi from "./Taxi";
import Van from "./Van";

const cars = [
  { name: "EV5", Component: EV5 },
  { name: "EV7", Component: EV7 },
  { name: "Taxi", Component: Taxi },
  { name: "Van", Component: Van },
];

const MenuContainer = memo(({ onSelectCar = () => {} }) => {
  const [selectedCar, setSelectedCar] = useState("EV5");

  const handleSelectCar = (name) => {
    setSelectedCar(name);
    onSelectCar(name);
  };

  useEffect(() => {
    // Set default selection on mount
    onSelectCar(selectedCar);
  }, [onSelectCar, selectedCar]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: "15px",
        overflowX: "auto",
        width: "100%",
        height: "100%",
        padding: "10px 0",
      }}
    >
      {cars.map(({ name, Component }) => {
        const isSelected = selectedCar === name;
        return (
          <motion.div
            key={name}
            style={{
              textAlign: "center",
              flex: "0 0 auto",
              cursor: "pointer",
              minWidth: "80px",
              border: "none",
              boxShadow: "none",
            }}
            onClick={() => handleSelectCar(name)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {/* Pass isSelected to change model highlight */}
            <Component isSelected={isSelected} />
            <p
              style={{
                margin: 0,
                fontSize: "0.85rem",
                color: "#ccc", // No selection highlight on text
              }}
            >
              {name}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
});

MenuContainer.displayName = "MenuContainer";

MenuContainer.propTypes = {
  onSelectCar: PropTypes.func,
};

export default MenuContainer;
