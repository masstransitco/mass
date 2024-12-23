// src/components/Map/DepartTime.jsx

import React, { useState, useEffect } from "react";
import styled from "@emotion/styled";
import Modal from "@mui/material/Modal";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import PropTypes from "prop-types";

// Define the optimized color palette
const COLORS = {
  primaryBackground: "#121212",
  surfaceBackground: "#1E1E1E",
  primaryText: "#FFFFFF",
  secondaryText: "#B0B0B0",
  primaryAccent: "#1E90FF", // Electric Blue
  primaryAccentHover: "#1C86EE",
  secondaryAccent: "#03DAC6", // Teal
  secondaryAccentHover: "#029A94",
  error: "#FF6F61", // Coral
  border: "#333333",
};

// Dark-themed modal container
const ModalContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: ${COLORS.surfaceBackground};
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 500px;
  width: 90%;
  color: ${COLORS.primaryText};
`;

// Title for the modal
const ModalTitle = styled.h2`
  font-size: 24px;
  text-align: center;
  color: ${COLORS.primaryText};
`;

// Container for the departure time selection
const DepartureTimeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

// Styled select component
const StyledSelect = styled(Select)`
  width: 90%;
  margin-top: 16px;
  .MuiSelect-select {
    padding: 12px;
    background-color: ${COLORS.surfaceBackground};
    color: ${COLORS.primaryText};
    border-radius: 8px;
  }

  .MuiOutlinedInput-notchedOutline {
    border: 1px solid ${COLORS.border};
  }

  &:hover .MuiOutlinedInput-notchedOutline {
    border: 1px solid ${COLORS.primaryAccentHover};
  }
`;

// Override MenuItem styles for dark theme
const StyledMenuItem = styled(MenuItem)`
  background-color: ${COLORS.surfaceBackground} !important;
  color: ${COLORS.primaryText} !important;

  &:hover {
    background-color: ${COLORS.primaryAccent} !important;
    color: ${COLORS.primaryText} !important;
  }
`;

// Container for the pricing options
const PricingOptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

// Individual pricing box
const PricingBox = styled.div`
  background-color: ${COLORS.surfaceBackground};
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  border: 1px solid ${COLORS.border};
`;

// Title for each pricing option
const PricingTitle = styled.h3`
  font-size: 20px;
  color: ${COLORS.primaryAccent};
  margin: 0;
`;

// Description text for each pricing option
const PricingDescription = styled.p`
  font-size: 14px;
  color: ${COLORS.secondaryText};
  margin: 0;
`;

// Styled primary button
const StyledButton = styled.button`
  width: 90%;
  padding: 12px;
  margin: 8px auto 0 auto;
  border-radius: 50px;
  border: none;
  background-color: ${COLORS.primaryAccent};
  color: ${COLORS.primaryText};
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease, opacity 0.3s ease;

  &:hover {
    background-color: ${COLORS.primaryAccentHover};
    opacity: 0.95;
  }

  &:disabled {
    background-color: ${COLORS.border};
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

// Styled secondary button for "Choose Destination"
const ChooseDestinationButton = styled(StyledButton)`
  background-color: ${COLORS.secondaryAccent};

  &:hover {
    background-color: ${COLORS.secondaryAccentHover};
  }
`;

const DepartTime = ({ open, onClose, onConfirm }) => {
  const [departureOptions, setDepartureOptions] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");

  useEffect(() => {
    if (!open) return;

    const generateTimeOptions = () => {
      const now = new Date();

      // Option 1: 45-60 mins
      const option1 = new Date(
        now.getTime() + (45 + Math.random() * 15) * 60000
      );

      // Option 2: 1h30-1h45
      const option2 = new Date(
        now.getTime() + (90 + Math.random() * 15) * 60000
      );

      // Option 3: 2h30-2h45
      const option3 = new Date(
        now.getTime() + (150 + Math.random() * 15) * 60000
      );

      return [option1, option2, option3].map((time) => ({
        value: time.getTime(),
        label: time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
    };

    setDepartureOptions(generateTimeOptions());
  }, [open]);

  const handleConfirm = (bookingType) => {
    if (selectedTime) {
      onConfirm({ selectedTime, bookingType }); // Pass selectedTime and bookingType
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="departure-time-modal"
      aria-describedby="select-departure-time"
    >
      <ModalContainer>
        <ModalTitle>Choose an Upcoming Departure</ModalTitle>

        <DepartureTimeContainer>
          <StyledSelect
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            displayEmpty
            renderValue={
              selectedTime
                ? undefined
                : () => (
                    <span style={{ color: COLORS.secondaryText }}>
                      Select departure time
                    </span>
                  )
            }
          >
            {departureOptions.map((option) => (
              <StyledMenuItem key={option.value} value={option.value}>
                {option.label}
              </StyledMenuItem>
            ))}
          </StyledSelect>
        </DepartureTimeContainer>

        <PricingOptionsContainer>
          <PricingBox>
            <PricingTitle>Pay-As-You-Go</PricingTitle>
            <PricingDescription>HKD$1 per minute</PricingDescription>
            <PricingDescription>
              HKD$600 max per day (24 hours from pick-up)
            </PricingDescription>
            <StyledButton
              onClick={() => handleConfirm("pay-as-you-go")}
              disabled={!selectedTime}
              aria-label="Confirm Pay-As-You-Go Booking"
            >
              Confirm your booking
            </StyledButton>
          </PricingBox>

          <PricingBox>
            <PricingTitle>Station-to-Station</PricingTitle>
            <PricingDescription>
              *Choose a destination to view fare
            </PricingDescription>
            <ChooseDestinationButton
              onClick={() => handleConfirm("station-to-station")}
              disabled={!selectedTime}
              aria-label="Choose Destination"
            >
              Choose Destination
            </ChooseDestinationButton>
          </PricingBox>
        </PricingOptionsContainer>
      </ModalContainer>
    </Modal>
  );
};

DepartTime.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired, // Handles confirmation with bookingType
};

export default DepartTime;
