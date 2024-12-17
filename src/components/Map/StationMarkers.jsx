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
          // Optional: Customize marker icon if needed
          // icon={{
          //   url: "/path-to-custom-icon.png",
          //   scaledSize: new window.google.maps.Size(30, 30),
          // }}
        />
      ))}
    </>
  );
};

StationMarkers.propTypes = {
  stations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
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
