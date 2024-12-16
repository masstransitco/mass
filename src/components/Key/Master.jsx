import React, { useState, useEffect } from "react";
import "./Master.css"; // Include modal styling

const LockUnlockModal = ({ isOpen, onClose }) => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const API_BASE_URL = "https://fleetapi-hk.cartrack.com/rest";
  const API_USERNAME = "URBA00001";
  const API_PASSWORD =
    "fd58cd26fefc8c2b2ba1f7f52b33221a65f645790a43ff9b8da35db7da6e1f33";
  const encodedAuth = btoa(`${API_USERNAME}:${API_PASSWORD}`);

  // Fetch the list of vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/vehicles`, {
          headers: {
            Authorization: `Basic ${encodedAuth}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setVehicles(data.vehicles || []);
        } else {
          const errorData = await response.json();
          setStatusMessage(
            `Failed to fetch vehicles: ${errorData.meta.message}`
          );
        }
      } catch (error) {
        setStatusMessage(`Error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) fetchVehicles(); // Fetch vehicles when the modal is opened
  }, [isOpen, API_BASE_URL, encodedAuth]);

  const handleCommand = async (command) => {
    if (!selectedVehicle) {
      setStatusMessage("Please select a vehicle.");
      return;
    }

    const url = `${API_BASE_URL}/vehicles/commands/${selectedVehicle}`;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Basic ${encodedAuth}`,
    };

    const body = JSON.stringify({
      command_type: command, // "lock" or "unlock"
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body,
      });

      if (response.ok) {
        setStatusMessage(`Command '${command}' sent successfully.`);
      } else {
        const errorData = await response.json();
        setStatusMessage(
          `Failed to send command. Error: ${errorData.meta.message}`
        );
      }
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>
          &times;
        </button>
        <h2>Lock/Unlock Vehicle</h2>

        {isLoading ? (
          <p>Loading vehicles...</p>
        ) : (
          <>
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
            >
              <option value="">Select a Vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.name || `Vehicle ${vehicle.id}`}
                </option>
              ))}
            </select>

            <div className="modal-buttons">
              <button onClick={() => handleCommand("lock")}>Lock</button>
              <button onClick={() => handleCommand("unlock")}>Unlock</button>
            </div>
          </>
        )}

        {statusMessage && <p>{statusMessage}</p>}
      </div>
    </div>
  );
};

export default LockUnlockModal;
