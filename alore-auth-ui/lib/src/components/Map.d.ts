import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet';
import React from 'react';
interface ILeafletMapProps {
    coordinates: LatLngTuple;
}
declare const LeafletMap: ({ coordinates }: ILeafletMapProps) => React.JSX.Element;
export default LeafletMap;
