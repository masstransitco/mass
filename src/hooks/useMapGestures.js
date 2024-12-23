// src/hooks/useMapGestures.js
import { useEffect, useRef } from "react";

/**
 * Custom hook to allow users to rotate and tilt the Google Maps viewport
 * using single-finger (thumb) swipe gestures on mobile devices.
 *
 * - Horizontal swipes rotate the map (adjust heading).
 * - Vertical swipes tilt the map (adjust tilt angle).
 *
 * @param {google.maps.Map} map - The Google Maps instance.
 */
const useMapGestures = (map) => {
  // Refs to store mutable values without causing re-renders
  const isDragging = useRef(false);
  const initialTouch = useRef({ x: 0, y: 0 });
  const initialHeading = useRef(0);
  const initialTilt = useRef(0);
  const animationFrameId = useRef(null);

  useEffect(() => {
    if (!map) return;

    const mapDiv = map.getDiv();
    if (!mapDiv) return;

    /**
     * Handle touchstart event.
     * Initializes gesture tracking if a single touch is detected.
     */
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        isDragging.current = true;
        initialTouch.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        initialHeading.current = map.getHeading() || 0;
        initialTilt.current = map.getTilt() || 0;
      }
    };

    /**
     * Handle touchmove event.
     * Calculates the difference in touch position to adjust heading and tilt.
     */
    const handleTouchMove = (e) => {
      if (!isDragging.current || e.touches.length !== 1) return;

      e.preventDefault(); // Prevent default scrolling behavior

      const currentTouch = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };

      const deltaX = currentTouch.x - initialTouch.current.x;
      const deltaY = currentTouch.y - initialTouch.current.y;

      // Define sensitivity factors
      const ROTATION_SENSITIVITY = 0.3; // Degrees per pixel
      const TILT_SENSITIVITY = 0.2; // Degrees per pixel

      const newHeading = initialHeading.current + deltaX * ROTATION_SENSITIVITY;
      let newTilt = initialTilt.current - deltaY * TILT_SENSITIVITY; // Invert Y for intuitive tilt

      // Clamp tilt between 0 and 45 degrees for usability
      newTilt = Math.max(0, Math.min(45, newTilt));

      // Throttle updates using requestAnimationFrame
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }

      animationFrameId.current = requestAnimationFrame(() => {
        map.setHeading(newHeading % 360); // Normalize heading
        map.setTilt(newTilt);
      });
    };

    /**
     * Handle touchend and touchcancel events.
     * Resets gesture tracking.
     */
    const handleTouchEnd = () => {
      if (isDragging.current) {
        isDragging.current = false;
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }
      }
    };

    // Add event listeners to the map's div
    mapDiv.addEventListener("touchstart", handleTouchStart, { passive: false });
    mapDiv.addEventListener("touchmove", handleTouchMove, { passive: false });
    mapDiv.addEventListener("touchend", handleTouchEnd, { passive: false });
    mapDiv.addEventListener("touchcancel", handleTouchEnd, { passive: false });

    // Cleanup event listeners on unmount or map change
    return () => {
      mapDiv.removeEventListener("touchstart", handleTouchStart);
      mapDiv.removeEventListener("touchmove", handleTouchMove);
      mapDiv.removeEventListener("touchend", handleTouchEnd);
      mapDiv.removeEventListener("touchcancel", handleTouchEnd);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [map]);
};

export default useMapGestures;
