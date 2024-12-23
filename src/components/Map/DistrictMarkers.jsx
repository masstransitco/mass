// src/components/Map/DistrictMarkers.jsx

import React from "react";
import PropTypes from "prop-types";
import { OverlayView } from "@react-google-maps/api";

/**
 * DistrictMarkers Component
 *
 * Renders district markers on the Google Map using OverlayView.
 * Each marker is a custom SVG rectangle displaying the district's name.
 *
 * Props:
 * - districts: Array of district objects containing id, name, position, and description.
 * - onDistrictClick: Function to handle click events on a district marker.
 */
const DistrictMarkers = ({ districts, onDistrictClick }) => {
  const rectHeight = 30; // Fixed height for the rectangles
  const padding = 10; // Padding around the text

  return (
    <>
      {districts.map((district) => {
        // Calculate the width of the rectangle based on district name
        const textWidth = district.name.length * 8; // Approximate width per character
        const rectWidth = textWidth + padding * 2; // Add padding to width

        return (
          <OverlayView
            key={district.id}
            position={district.position}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} // Ensures the overlay receives mouse and touch events
          >
            <div
              style={{
                position: "absolute",
                transform: "translate(-50%, -50%)", // Center the overlay
                cursor: "pointer",
              }}
              onClick={() => onDistrictClick(district)}
              role="button"
              aria-label={`District: ${district.name}`}
              tabIndex={0} // Make the div focusable for accessibility
              onKeyPress={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onDistrictClick(district);
                }
              }}
            >
              <svg
                width={rectWidth}
                height={rectHeight}
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <filter
                    id="shadow"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                    <feOffset dx="2" dy="2" result="offsetblur" />
                    <feFlood floodColor="rgba(0, 0, 0, 0.5)" />
                    <feComposite in2="offsetblur" operator="in" />
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <rect
                  x="0"
                  y="0"
                  width={rectWidth}
                  height={rectHeight}
                  fill="#D3D3D3" // Light gray color
                  filter="url(#shadow)" // Apply shadow filter
                  rx="5" // Rounded corners
                />
                <text
                  x={padding}
                  y={rectHeight / 2}
                  alignmentBaseline="middle"
                  fill="#000000" // Text color
                  fontSize="14"
                  fontFamily="Arial"
                >
                  {district.name} {/* Displaying district name */}
                </text>
              </svg>
            </div>
          </OverlayView>
        );
      })}
    </>
  );
};

DistrictMarkers.propTypes = {
  districts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      position: PropTypes.shape({
        lat: PropTypes.number.isRequired,
        lng: PropTypes.number.isRequired,
      }).isRequired,
      description: PropTypes.string,
    })
  ).isRequired,
  onDistrictClick: PropTypes.func.isRequired,
};

export default DistrictMarkers;
