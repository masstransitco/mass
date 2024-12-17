// src/components/Map/DistrictMarkers.jsx

import React from "react";
import PropTypes from "prop-types";
import { Marker } from "@react-google-maps/api";

const DistrictMarkers = ({ districts, onDistrictClick }) => {
  return (
    <>
      {districts.map((district) => (
        <Marker
          key={district.id}
          position={district.position}
          title={district.name}
          onClick={() => onDistrictClick && onDistrictClick(district)}
        />
      ))}
    </>
  );
};

DistrictMarkers.propTypes = {
  districts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      position: PropTypes.shape({
        lat: PropTypes.number.isRequired,
        lng: PropTypes.number.isRequired,
      }).isRequired,
    })
  ).isRequired,
  onDistrictClick: PropTypes.func.isRequired,
};

export default React.memo(DistrictMarkers);
