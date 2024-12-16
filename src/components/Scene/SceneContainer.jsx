import React, { useEffect, useRef } from "react";
import WebScene from "@arcgis/core/WebScene";
import SceneView from "@arcgis/core/views/SceneView";
import "./SceneContainer.css";

const SceneContainer = () => {
  const sceneRef = useRef(null);

  useEffect(() => {
    const webScene = new WebScene({
      portalItem: {
        id: "4304b6c3b2084330b4a2153da9fbbcf0", // Replace with a valid WebScene ID
      },
    });

    const sceneView = new SceneView({
      container: sceneRef.current,
      map: webScene,
    });

    return () => {
      if (sceneView) {
        sceneView.destroy();
      }
    };
  }, []);

  return <div ref={sceneRef} style={{ height: "100vh", width: "100%" }} />;
};

export default SceneContainer;
