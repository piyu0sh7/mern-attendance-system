import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition, radius }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <>
      <Marker position={position} />
      {radius && <Circle center={position} radius={radius} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.2 }} />}
    </>
  );
}

function LocateControl({ setPosition }) {
  const map = useMap();
  const handleLocate = () => {
    map.locate().on("locationfound", function (e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 16);
    }).on("locationerror", function (e) {
      alert("Could not find your location. Please check browser permissions.");
    });
  };

  return (
    <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
      <button 
        type="button" 
        onClick={(e) => { e.preventDefault(); handleLocate(); }}
        style={{ 
          padding: '8px 12px', 
          cursor: 'pointer', 
          background: 'var(--primary-color)', 
          color: 'white',
          border: 'none', 
          borderRadius: '4px', 
          fontWeight: '600',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}
      >
        📍 Locate Me
      </button>
    </div>
  );
}

const LocationPicker = ({ lat, lon, onLocationSelect, radius }) => {
  const defaultPosition = [20.5937, 78.9629]; // Default to India roughly
  const position = lat && lon ? { lat, lng: lon } : null;

  const setPosition = (pos) => {
    onLocationSelect(pos.lat, pos.lng);
  };

  return (
    <div style={{ height: '300px', width: '100%', marginTop: '0.5rem', marginBottom: '1.5rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 0 }}>
      <MapContainer 
        center={position || defaultPosition} 
        zoom={position ? 15 : 4} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} setPosition={setPosition} radius={radius} />
        <LocateControl setPosition={setPosition} />
      </MapContainer>
    </div>
  );
};

export default LocationPicker;
