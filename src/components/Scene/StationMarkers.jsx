// src/components/Map/StationMarkers.jsx

import React from "react";
import PropTypes from "prop-types";
import { Marker } from "@react-google-maps/api";

const StationMarkers = ({ stations, onStationClick }) => {
  return (
    <>
      {stations.map((station) => (
        <Marker
          key={station.id}
          position={station.position}
          title={station.place}
          onClick={() => onStationClick && onStationClick(station)}
        />
      ))}
    </>
  );
};

StationMarkers.propTypes = {
  stations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      place: PropTypes.string.isRequired,
      position: PropTypes.shape({
        lat: PropTypes.number.isRequired,
        lng: PropTypes.number.isRequired,
      }).isRequired,
    })
  ).isRequired,
  onStationClick: PropTypes.func.isRequired,
};

export default React.memo(StationMarkers);
