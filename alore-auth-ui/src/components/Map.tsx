'use client';

import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L, { LatLngTuple } from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import React from 'react';

// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon.src,
  iconRetinaUrl: markerIcon2x.src,
  shadowUrl: markerShadow.src,
});

const defaultLatLng: LatLngTuple = [0, 0];
const zoom: number = 11;

interface ILeafletMapProps {
  coordinates: LatLngTuple;
}

const LeafletMap = ({ coordinates = defaultLatLng }: ILeafletMapProps) => (
  <MapContainer
    center={coordinates}
    zoom={zoom}
    style={{ height: '100%', width: '100%' }}
    scrollWheelZoom={false}
  >
    <TileLayer
      url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    />
    <Marker position={coordinates} />
  </MapContainer>
);

export default LeafletMap;
