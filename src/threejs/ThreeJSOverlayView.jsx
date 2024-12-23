// src/threejs/ThreeJSOverlayView.jsx

/* global google */

import {
  Vector3,
  PerspectiveCamera,
  WebGLRenderer,
  Scene,
  AmbientLight,
  DirectionalLight,
  MeshBasicMaterial,
  Mesh,
  Raycaster,
} from "three";

import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";

export default class ThreeJSOverlayView extends google.maps.WebGLOverlayView {
  constructor() {
    super();
    this.scene = new Scene();
    this.camera = new PerspectiveCamera();
    this.renderer = null;
    this.models = {}; // Store models by identifier
    this.labels = {};
    this.animationRequest = null;
    this.carAnimationActive = false; // Flag to ensure animation runs only once

    this.raycaster = new Raycaster();
    this.mouse = new Vector3();
    this.INTERSECTED = null; // Currently hovered object

    // Bind methods to ensure correct 'this' context
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  /**
   * Called when the overlay is added to the map.
   */
  onAdd() {
    // Add event listeners
    const canvas = this.getCanvas();
    if (canvas) {
      canvas.addEventListener("mousemove", this.onMouseMove, false);
      canvas.addEventListener("click", this.onClick, false);
    }

    // Initialize any additional resources here if necessary
  }

  /**
   * Called when the WebGL context is restored.
   * Initialize Three.js renderer and scene.
   */
  onContextRestored({ gl }) {
    this.renderer = new WebGLRenderer({
      canvas: gl.canvas,
      context: gl,
      ...gl.getContextAttributes(),
    });
    this.renderer.autoClear = false;
    this.renderer.autoClearDepth = false;

    const { width, height } = gl.canvas;
    this.renderer.setSize(width, height);

    // Add lights to the scene
    this.scene.add(new AmbientLight(0xffffff, 0.5));
    const directionalLight = new DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 0);
    this.scene.add(directionalLight);
  }

  /**
   * Called on each frame to render the overlay.
   */
  onDraw({ gl, transformer }) {
    // Assign transformer to the instance
    this.transformer = transformer;

    console.log(
      "Available transformer methods:",
      Object.getOwnPropertyNames(transformer)
    );

    // Check for necessary transformer methods
    if (typeof transformer.fromLatLngAltitude !== "function") {
      console.error("transformer.fromLatLngAltitude is not a function.");
      return;
    }

    // Example: Position the camera based on the map center
    const mapCenter = this.getMap().getCenter();
    const centerLatLng = { lat: mapCenter.lat(), lng: mapCenter.lng() };
    const centerVector = this.latLngToVector3(centerLatLng, 0);

    // Set camera position (adjust Z as needed)
    this.camera.position.set(centerVector.x, centerVector.y, 1000);
    this.camera.lookAt(new Vector3(centerVector.x, centerVector.y, 0));

    // Update renderer size
    const { width, height } = gl.canvas;
    this.renderer.setSize(width, height);

    // Render the scene
    this.renderer.state.reset();
    this.renderer.render(this.scene, this.camera);
    this.renderer.resetState();

    // Handle interactivity
    this.handleInteractivity();
  }

  /**
   * Called when the overlay is removed from the map.
   */
  onRemove() {
    // Clean up Three.js objects
    this.clearModels();
    this.clearLabels();

    // Remove event listeners
    const canvas = this.getCanvas();
    if (canvas) {
      canvas.removeEventListener("mousemove", this.onMouseMove, false);
      canvas.removeEventListener("click", this.onClick, false);
    }

    // Dispose of renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
  }

  /**
   * Convert LatLng to Vector3 using the transformer for accurate positioning.
   * @param {google.maps.LatLngLiteral} latLng - { lat, lng }
   * @param {number} altitude - Altitude in meters (default: 0)
   * @returns {THREE.Vector3}
   */
  latLngToVector3(latLng, altitude = 0) {
    if (typeof this.transformer.fromLatLngAltitude !== "function") {
      console.error("transformer.fromLatLngAltitude is not a function.");
      return new Vector3(0, 0, 0); // Default position to prevent crashes
    }

    const vector = this.transformer.fromLatLngAltitude(latLng, altitude);
    return new Vector3(vector.x, vector.y, vector.z);
  }

  /**
   * Add a 3D model with a unique identifier.
   * @param {google.maps.LatLngLiteral} position - { lat, lng }
   * @param {THREE.Object3D} model - The 3D model to add
   * @param {String} identifier - Unique identifier for the model
   */
  addModel(position, model, identifier = null) {
    if (identifier && this.models[identifier]) {
      // Remove existing model with the same identifier
      this.removeModel(identifier);
    }

    const vector = this.latLngToVector3(position);
    model.position.set(vector.x, vector.y, vector.z); // Accurate positioning
    this.scene.add(model);

    if (identifier) {
      this.models[identifier] = model;
    }

    this.requestRedraw();
  }

  /**
   * Remove a model by its unique identifier.
   * @param {String} identifier - Identifier of the model to remove
   */
  removeModel(identifier) {
    const model = this.models[identifier];
    if (model) {
      this.scene.remove(model);
      delete this.models[identifier];
      this.requestRedraw();
    }
  }

  /**
   * Clear all models from the scene.
   */
  clearModels() {
    Object.keys(this.models).forEach((identifier) => {
      const model = this.models[identifier];
      this.scene.remove(model);
      delete this.models[identifier];
    });
    this.requestRedraw();
  }

  /**
   * Add a label with a unique identifier.
   * @param {google.maps.LatLngLiteral} position - { lat, lng }
   * @param {String} text - Label text
   * @param {String} identifier - Unique identifier for the label
   */
  addLabel(position, text, identifier = null) {
    if (identifier && this.labels[identifier]) {
      // Remove existing label with the same identifier
      this.removeLabel(identifier);
    }

    const loader = new FontLoader();
    loader.load(
      "/fonts/helvetiker_regular.typeface.json", // Ensure this path is correct
      (font) => {
        const geometry = new TextGeometry(text, {
          font: font,
          size: 10, // Adjust size for visibility
          height: 1, // Adjust height for visibility
        });
        const material = new MeshBasicMaterial({ color: 0xffffff });
        const mesh = new Mesh(geometry, material);
        const vector = this.latLngToVector3(position);
        mesh.position.set(vector.x, vector.y, vector.z + 50); // Adjust z for height above the map
        this.scene.add(mesh);

        if (identifier) {
          this.labels[identifier] = mesh;
        }

        this.requestRedraw();
      },
      undefined,
      (error) => {
        console.error("Error loading font for label:", error);
      }
    );
  }

  /**
   * Remove a label by its unique identifier.
   * @param {String} identifier - Identifier of the label to remove
   */
  removeLabel(identifier) {
    const label = this.labels[identifier];
    if (label) {
      this.scene.remove(label);
      delete this.labels[identifier];
      this.requestRedraw();
    }
  }

  /**
   * Clear all labels from the scene.
   */
  clearLabels() {
    Object.keys(this.labels).forEach((identifier) => {
      const label = this.labels[identifier];
      this.scene.remove(label);
      delete this.labels[identifier];
    });
    this.requestRedraw();
  }

  /**
   * Animate the camera to a specific position.
   * @param {google.maps.LatLngLiteral} position - { lat, lng }
   * @param {Number} zoom - Zoom level
   * @param {Number} tilt - Tilt angle
   * @param {Number} heading - Heading angle
   * @param {Function} callback - Callback after animation completes
   */
  animateCameraTo(position, zoom, tilt, heading, callback) {
    if (!this.getMap()) {
      console.error("Map instance is not available.");
      return;
    }

    // Implement smooth camera animation using Google Maps methods
    // Note: Google Maps JavaScript API does not provide direct smooth animations for these properties
    // You might need to implement custom interpolation for smooth transitions

    this.getMap().panTo(position);
    this.getMap().setZoom(zoom);
    this.getMap().setTilt(tilt);
    this.getMap().setHeading(heading);

    // Simulate animation duration
    setTimeout(() => {
      if (callback) callback();
    }, 2000); // 2 seconds animation
  }

  /**
   * Animate a model along a path.
   * @param {String} identifier - Identifier of the model to animate
   * @param {Array} path - Array of { lat, lng } points
   * @param {Number} duration - Animation duration in milliseconds
   * @param {Function} onComplete - Callback after animation completes
   */
  animateModelAlongPath(identifier, path, duration, onComplete) {
    const model = this.models[identifier];
    if (!model || this.carAnimationActive) return; // Prevent multiple animations

    let startTime = null;
    this.carAnimationActive = true;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const totalPoints = path.length;
      const index = Math.floor(progress * (totalPoints - 1));
      const nextIndex = Math.min(index + 1, totalPoints - 1);
      const t = progress * (totalPoints - 1) - index;

      const currentPos = {
        lat: path[index].lat + t * (path[nextIndex].lat - path[index].lat),
        lng: path[index].lng + t * (path[nextIndex].lng - path[index].lng),
      };

      const vector = this.latLngToVector3(currentPos);
      model.position.set(vector.x, vector.y, vector.z);

      // Update model orientation based on movement direction
      if (nextIndex < totalPoints - 1) {
        const direction = new Vector3(
          path[nextIndex + 1].lng - path[nextIndex].lng,
          path[nextIndex + 1].lat - path[nextIndex].lat,
          0
        ).normalize();
        const angle = Math.atan2(direction.y, direction.x);
        model.rotation.z = -angle;
      }

      if (progress < 1) {
        this.animationRequest = requestAnimationFrame(animate);
      } else {
        this.carAnimationActive = false;
        if (onComplete) onComplete();
        this.animationRequest = null;
      }

      this.requestRedraw();
    };

    this.animationRequest = requestAnimationFrame(animate);
  }

  /**
   * Create a mesh-line from the spline to render the track the car is driving.
   * @param {THREE.CatmullRomCurve3} curve
   * @returns {THREE.Line2}
   */
  createTrackLine(curve) {
    const numPoints = 100; // Increase for smoother lines
    const curvePoints = curve.getSpacedPoints(numPoints);
    const positions = new Float32Array(numPoints * 3);

    for (let i = 0; i < numPoints; i++) {
      curvePoints[i].toArray(positions, 3 * i);
    }

    const trackLine = new Line2(
      new LineGeometry(),
      new LineMaterial({
        color: 0x0f9d58,
        linewidth: 5,
        vertexColors: false,
        dashed: false,
      })
    );

    trackLine.geometry.setPositions(positions);
    trackLine.computeLineDistances();

    return trackLine;
  }

  /**
   * Handle interactivity such as hover effects.
   */
  handleInteractivity() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersectObjects = Object.values(this.models).concat(
      Object.values(this.labels)
    ); // Include labels for interaction
    const intersects = this.raycaster.intersectObjects(intersectObjects, true);

    if (intersects.length > 0) {
      const firstIntersect = intersects[0].object;
      if (this.INTERSECTED !== firstIntersect) {
        if (this.INTERSECTED) {
          // Reset previous intersected object's material
          this.INTERSECTED.material.emissive.setHex(
            this.INTERSECTED.currentHex
          );
        }
        this.INTERSECTED = firstIntersect;
        this.INTERSECTED.currentHex =
          this.INTERSECTED.material.emissive.getHex();
        this.INTERSECTED.material.emissive.setHex(0xff0000); // Highlight color
      }
    } else {
      if (this.INTERSECTED) {
        // Reset previous intersected object's material
        this.INTERSECTED.material.emissive.setHex(this.INTERSECTED.currentHex);
      }
      this.INTERSECTED = null;
    }
  }

  /**
   * Handle mouse move events for hover interactivity.
   * @param {MouseEvent} event
   */
  onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1) for both components.
    const rect = this.getCanvas().getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.requestRedraw();
  }

  /**
   * Handle click events for selecting models.
   * @param {MouseEvent} event
   */
  onClick(event) {
    if (this.INTERSECTED) {
      const identifier = Object.keys(this.models).find(
        (key) => this.models[key] === this.INTERSECTED
      );
      if (identifier) {
        // Emit a custom event or call a callback to notify about the selection
        console.log(`Model with identifier ${identifier} was clicked.`);
        if (this.onModelClick) {
          this.onModelClick(identifier);
        }
      }
    }
  }

  /**
   * Add a callback for model clicks.
   * @param {Function} callback
   */
  setOnModelClick(callback) {
    this.onModelClick = callback;
  }
}
