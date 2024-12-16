// src/hooks/useMapGestures.js
import { useEffect } from "react";

const useMapGestures = (map) => {
  useEffect(() => {
    if (!map) return;
    const mapDiv = map.getDiv();
    if (!mapDiv) return;

    let isInteracting = false;
    let lastX = 0;
    let lastY = 0;
    let animationFrameId = null;

    const handlePointerDown = (e) => {
      isInteracting = true;
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const handlePointerMove = (e) => {
      if (!isInteracting) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;

      // Throttle updates using requestAnimationFrame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        const currentTilt = map.getTilt() || 0;
        const currentHeading = map.getHeading() || 0;

        let newTilt = currentTilt + dy * 0.1;
        newTilt = Math.max(0, Math.min(67.5, newTilt)); // Limit tilt between 0 and 67.5 degrees

        let newHeading = currentHeading + dx * 0.5;
        newHeading = (newHeading + 360) % 360; // Normalize heading between 0-360

        map.setOptions({
          tilt: newTilt,
          heading: newHeading,
        });
      });
    };

    const handlePointerUp = () => {
      isInteracting = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    };

    // Add event listeners
    mapDiv.addEventListener("pointerdown", handlePointerDown, {
      passive: false,
    });
    mapDiv.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    mapDiv.addEventListener("pointerup", handlePointerUp, { passive: false });
    mapDiv.addEventListener("pointercancel", handlePointerUp, {
      passive: false,
    });
    mapDiv.addEventListener("pointerleave", handlePointerUp, {
      passive: false,
    });

    // Cleanup event listeners on unmount
    return () => {
      mapDiv.removeEventListener("pointerdown", handlePointerDown);
      mapDiv.removeEventListener("pointermove", handlePointerMove);
      mapDiv.removeEventListener("pointerup", handlePointerUp);
      mapDiv.removeEventListener("pointercancel", handlePointerUp);
      mapDiv.removeEventListener("pointerleave", handlePointerUp);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [map]);
};

export default useMapGestures;
