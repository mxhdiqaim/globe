/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useEffect, useState, useCallback } from "react";
import Globe from "react-globe.gl";
import type { Feature } from "geojson";

// URL for a high-res earth image
const GLOBE_IMAGE_URL = "//unpkg.com/three-globe/example/img/earth-night.jpg";
const BUMP_IMAGE_URL = "//unpkg.com/three-globe/example/img/earth-topology.png";

const GlobeComponent = () => {
  const globeEl = useRef<any>(null);
  const [countries, setCountries] = useState({
    type: "Feature",
    features: [],
  });

  const [hoveredCountry, setHoveredCountry] = useState<any | null>(null);

  // Handle Polygon Hover Event (provided directly by react-globe.gl)
  const handlePolygonHover = useCallback((polygon: object | null) => {
    setHoveredCountry(polygon);
    if (polygon) {
      console.log("Hovered country data:", polygon);
    } else {
      console.log("No country hovered.");
    }
  }, []);

  // Define Polygon Styling based on hover state
  const getPolygonColor = useCallback(
    (polygon: object) => {
      const defaultColor = "rgba(30, 144, 255, 0.5)";
      const hoverColor = "rgba(255, 255, 0, 0.5)";
      const feature = polygon as Feature;

      if (hoveredCountry && feature.properties && hoveredCountry.properties.iso_a2 === feature.properties.iso_a2) {
        return hoverColor;
      }
      return defaultColor;
    },
    [hoveredCountry]
  );

  useEffect(() => {
    fetch("/custom-110-metre.geojson")
      .then((res) => res.json())
      .then((geoJson) => {
        setCountries(geoJson);
      })
      .catch((error) => console.error("Error loading GeoJSON:", error));
  }, []);

  // Set initial camera position and controls
  useEffect(() => {
    if (globeEl.current) {
      // Auto-rotate
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.3;

      // Zoom level
      globeEl.current.camera().zoom = 1;

      // Set initial point of view (lat, lng, altitude)
      // Altitude is in units of globe radius, 1.5 is good for an overview
      globeEl.current.pointOfView({ lat: 9.072264, lng: 7.491302, altitude: 1.5 }, 5000);
    }
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      <Globe
        ref={globeEl}
        width={window.innerWidth}
        height={window.innerHeight}
        globeImageUrl={GLOBE_IMAGE_URL}
        bumpImageUrl={BUMP_IMAGE_URL}
        backgroundColor='rgba(0,0,0,0)'
        showAtmosphere={true}
        atmosphereColor='#ADD8E6'
        atmosphereAltitude={0.3}
        polygonsData={countries.features}
        polygonLabel={(d) => {
          const p = d as Feature;

          if (!p.properties) {
            return "";
          }

          return `<b>${p.properties.admin}</b> (${p.properties.iso_a2})`;
        }}
        polygonCapColor={getPolygonColor}
        polygonSideColor={() => "rgba(0, 100, 0, 0.15)"}
        polygonStrokeColor={() => "#111"}
        polygonAltitude={0.009}
        onPolygonHover={handlePolygonHover}
        enablePointerInteraction={true}
      />
      {hoveredCountry && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            backgroundColor: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "10px",
            borderRadius: "5px",
            zIndex: 1000,
          }}
        >
          <h3>{hoveredCountry.properties.admin}</h3>
          <p>ISO A2: {hoveredCountry.properties.iso_a2}</p>
          {hoveredCountry.properties.pop_est && (
            <p>Population Est: {hoveredCountry.properties.pop_est.toLocaleString()}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobeComponent;
