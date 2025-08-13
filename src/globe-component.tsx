/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useEffect, useState, useCallback } from "react";
import Globe from "react-globe.gl";
import type { Feature } from "geojson";
import * as turf from "@turf/turf";
import { Box, Paper, TextField, List, ListItem, ListItemButton, ListItemText, Typography } from "@mui/material";

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
  const [selectedCountry, setSelectedCountry] = useState<any | null>(null);

  const [countryPoints, setCountryPoints] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const [cityPoints, setCityPoints] = useState<any[]>([]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (query.length > 2) {
      const filteredResults = countries.features.filter((feature: any) =>
        feature.properties.admin.toLowerCase().includes(query.toLowerCase())
      );
      setSearchResults(filteredResults);
    } else {
      setSearchResults([]);
    }
  };

  const handlePolygonHover = useCallback((polygon: object | null) => {
    setHoveredCountry(polygon);
  }, []);

  const getPolygonColor = useCallback(
    (polygon: object) => {
      const defaultColor = "rgba(30, 144, 255, 0.5)";
      const hoverColor = "rgba(255, 255, 0, 0.5)";
      const clickColor = "rgba(0, 255, 0, 0.7)";
      const feature = polygon as Feature;

      if (selectedCountry && selectedCountry.properties.iso_a2 === (feature as any).properties.iso_a2) {
        return clickColor;
      }
      if (hoveredCountry && feature.properties && hoveredCountry.properties.iso_a2 === feature.properties.iso_a2) {
        return hoverColor;
      }
      return defaultColor;
    },
    [hoveredCountry, selectedCountry]
  );

  const handlePolygonClick = useCallback(
    (polygon: any | null) => {
      if (polygon) {
        if (selectedCountry && selectedCountry.properties.iso_a2 === polygon.properties.iso_a2) {
          setSelectedCountry(null);
          globeEl.current.controls().autoRotate = true;
          globeEl.current.pointOfView({ lat: 9.072264, lng: 7.491302, altitude: 1.5 }, 2000);
        } else {
          setSelectedCountry(polygon);
          try {
            const centroid = turf.centroid(polygon);
            const [lng, lat] = centroid.geometry.coordinates;
            globeEl.current.pointOfView({ lat, lng, altitude: 0.5 }, 2000);
            globeEl.current.controls().autoRotate = false;
          } catch (error) {
            console.error("Error calculating centroid or flying camera:", error);
          }
        }
      } else {
        setSelectedCountry(null);
        globeEl.current.controls().autoRotate = true;
        globeEl.current.pointOfView({ lat: 9.072264, lng: 7.491302, altitude: 1.5 }, 2000);
      }
    },
    [selectedCountry]
  );

  const handleSearchResultClick = (countryFeature: any) => {
    setSelectedCountry(countryFeature);

    try {
      const centroid = turf.centroid(countryFeature);
      const [lng, lat] = centroid.geometry.coordinates;
      globeEl.current.pointOfView({ lat, lng, altitude: 0.5 }, 2000);
      globeEl.current.controls().autoRotate = false;
    } catch (error) {
      console.error("Error calculating centroid or flying camera:", error);
    }

    setSearchQuery("");
    setSearchResults([]);
  };

  useEffect(() => {
    if (countries.features.length > 0) {
      const populationThreshold = 50_000_000;

      const importantCountries = countries.features.filter(
        (feature: any) => feature.properties.pop_est > populationThreshold
      );

      const points = importantCountries.map((feature: any) => ({
        lat: feature.properties.label_y,
        lng: feature.properties.label_x,
        label: feature.properties.admin,
        size: feature.properties.pop_est ? Math.log(feature.properties.pop_est) / 10 : 0.5,
        population: feature.properties.pop_est,
      }));
      setCountryPoints(points);
    }
  }, [countries]);

  const handleGlobeZoom = useCallback((state: any) => {
    const currentAltitude = state.altitude;
    const zoomThreshold = 0.6; // Matches the backend's threshold

    // Only fetch if the zoom level has changed significantly and we're crossing the threshold
    if (currentAltitude < zoomThreshold) {
      fetch(`http://localhost:5000/api/cities?altitude=${currentAltitude}`)
        .then((res) => res.json())
        .then((geoJson) => {
          const points = geoJson.features.map((feature: any) => ({
            lat: feature.geometry.coordinates[1],
            lng: feature.geometry.coordinates[0],
            label: feature.properties.name,
            population: feature.properties.population,
            size: feature.properties.population ? Math.max(0.1, Math.log(feature.properties.population) / 15) : 0.1,
          }));
          setCityPoints(points);
        })
        .catch((error) => console.error("Error fetching city data:", error));
    } else {
      setCityPoints([]); // Clear points when zoomed out
    }
  }, []);

  useEffect(() => {
    fetch("/custom-110-metre.geojson")
      .then((res) => res.json())
      .then((geoJson) => {
        setCountries(geoJson);
      })
      .catch((error) => console.error("Error loading GeoJSON:", error));
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/cities")
      .then((res) => {
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        return res.json();
      })
      .then((geoJson) => {
        const points = geoJson.features.map((feature: any) => ({
          lat: feature.geometry.coordinates[1],
          lng: feature.geometry.coordinates[0],
          label: feature.properties.name,
          size: feature.properties.population ? Math.max(0.1, Math.log(feature.properties.population) / 15) : 0.1,
          population: feature.properties.population,
        }));
        setCityPoints(points);
      })
      .catch((error) => console.error("Error fetching city data:", error));
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.3;
      globeEl.current.pointOfView({ lat: 9.072264, lng: 7.491302, altitude: 1.5 }, 5000);
    }
  }, []);

  return (
    <Box sx={{ width: "100vw", height: "100vh", overflow: "hidden" }}>
      {/* Top-left UI Panel (Search & Filter Info) */}
      <Paper
        elevation={4}
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          zIndex: 1000,
          p: 2,
          backgroundColor: "rgba(30, 30, 30, 0.7)",
          color: "white",
          borderRadius: 2,
          minWidth: 300,
          backdropFilter: "blur(5px)",
        }}
      >
        <Typography variant='h6' gutterBottom>
          Global Insights
        </Typography>
        <TextField
          fullWidth
          label='Search for a country...'
          variant='outlined'
          size='small'
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{
            input: { color: "white" },
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
              "&:hover fieldset": { borderColor: "white" },
              "&.Mui-focused fieldset": { borderColor: "white" },
            },
            "& .MuiInputLabel-root": { color: "rgba(255, 255, 255, 0.7)" },
            "& .MuiInputLabel-root.Mui-focused": { color: "white" },
          }}
        />

        <Typography variant='caption' sx={{ display: "block", mt: 1, color: "rgba(255, 255, 255, 0.7)" }}>
          Showing countries with population over 50 million
        </Typography>

        {searchResults.length > 0 && searchQuery.length > 2 && (
          <List
            sx={{
              mt: 1,
              maxHeight: 300,
              overflowY: "auto",
              backgroundColor: "rgba(0,0,0,0.5)",
              borderRadius: 1,
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {searchResults.map((country: any) => (
              <ListItem disablePadding key={country.properties.iso_a2}>
                <ListItemButton onClick={() => handleSearchResultClick(country)}>
                  <ListItemText primary={country.properties.admin} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Globe Component */}
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
        onPolygonClick={handlePolygonClick}
        onGlobeClick={() => handlePolygonClick(null)}
        enablePointerInteraction={true}
        onZoom={handleGlobeZoom}
        pointsData={[...countryPoints, ...cityPoints]}
        pointAltitude={(point) => (point as any).size}
        pointColor={() => "yellow"}
        pointLabel={(point) =>
          `Country: ${(point as any).label}\nPopulation: ${
            (point as any).population ? (point as any).population.toLocaleString() : "N/A"
          }`
        }
        pointRadius={0.2}
        pointResolution={12}
      />

      {/* Bottom-left UI Panel (Selected Country Info) */}
      {selectedCountry && (
        <Paper
          elevation={4}
          sx={{
            position: "absolute",
            bottom: 20,
            left: 20,
            zIndex: 1000,
            p: 2,
            backgroundColor: "rgba(30, 30, 30, 0.7)",
            color: "white",
            borderRadius: 2,
            minWidth: 250,
            backdropFilter: "blur(5px)",
          }}
        >
          <Typography variant='h6' gutterBottom>
            {selectedCountry.properties.admin}
          </Typography>
          <Typography variant='body2'>ISO A2: {selectedCountry.properties.iso_a2}</Typography>
          {selectedCountry.properties.pop_est && (
            <Typography variant='body2'>
              Population Est: {selectedCountry.properties.pop_est.toLocaleString()}
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default GlobeComponent;
