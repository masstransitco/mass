import React from "react";
import { Modal, Button } from "react-bootstrap";

const MTCGameModal = ({ show, onClose }) => {
  const iframeStyle = {
    width: "95%",
    height: "95vh", // Adjust the height of the iframe as needed
    border: "none",
  };

  return (
    <Modal show={show} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Mass Transit Game</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <iframe
          src="https://air.city"
          style={iframeStyle}
          title="Mass Transit Game"
          allowFullScreen
          loading="lazy"
        ></iframe>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default MTCGameModal;
