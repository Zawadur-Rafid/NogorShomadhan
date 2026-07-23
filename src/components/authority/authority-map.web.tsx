import { createElement, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ComplaintLocation } from '../MapView';

type AuthorityMapProps = {
  locations: ComplaintLocation[];
  onLocationPress?: (location: ComplaintLocation) => void;
};

export default function AuthorityMap({ locations, onLocationPress }: AuthorityMapProps) {
  useEffect(() => {
    const handleMarkerPress = (event: MessageEvent) => {
      const message = event.data as { type?: string; id?: string } | undefined;
      if (message?.type !== 'authority-complaint-marker' || !message.id) return;
      const location = locations.find((item) => item.id === message.id);
      if (location) onLocationPress?.(location);
    };

    window.addEventListener('message', handleMarkerPress);
    return () => window.removeEventListener('message', handleMarkerPress);
  }, [locations, onLocationPress]);

  const mapDocument = useMemo(() => {
    const locationData = JSON.stringify(locations).replaceAll('<', '\\u003c');

    return `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <style>
            html, body, #map { width: 100%; height: 100%; margin: 0; }
            body { background: #e8edf4; font-family: Arial, sans-serif; }
            .leaflet-popup-content-wrapper { border-radius: 12px; }
            .pin { width: 18px; height: 18px; border: 3px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 2px 7px rgba(0,0,0,.25); }
            .pin span { display: block; width: 6px; height: 6px; margin: 6px; border-radius: 50%; background: white; }
            .title { margin: 0 0 5px; color: #1f2937; font-size: 13px; font-weight: 700; }
            .status { display: inline-block; margin-bottom: 5px; padding: 3px 7px; border-radius: 10px; font-size: 9px; font-weight: 700; }
            .description { margin: 0; max-width: 220px; color: #667085; font-size: 11px; line-height: 1.4; }
          </style>
        </head>
        <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <script>
            const locations = ${locationData};
            const map = L.map('map', { zoomControl: true, attributionControl: true }).setView([23.8375, 90.3695], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
            const bounds = [];
            locations.forEach((item) => {
              const pending = item.status.toUpperCase() === 'PENDING';
              const progress = item.status.toUpperCase() === 'IN PROGRESS';
              const color = pending ? '#EF4444' : progress ? '#C67B00' : '#2563EB';
              const background = pending ? '#FEF2F2' : progress ? '#FEF7E8' : '#EFF6FF';
              const icon = L.divIcon({
                className: '',
                html: '<div class="pin" style="background:' + color + '"><span></span></div>',
                iconSize: [24, 30],
                iconAnchor: [12, 27],
                popupAnchor: [0, -25]
              });
              const marker = L.marker([item.lat, item.lng], { icon }).addTo(map).bindPopup(
                '<p class="title">' + item.title + '</p>' +
                '<span class="status" style="color:' + color + ';background:' + background + '">' + item.status + '</span>' +
                '<p class="description">' + item.description + '</p>'
              );
              marker.on('click', () => {
                window.parent.postMessage({
                  type: 'authority-complaint-marker',
                  id: item.id
                }, '*');
              });
              bounds.push([item.lat, item.lng]);
            });
            if (bounds.length) map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
          </script>
        </body>
      </html>`;
  }, [locations]);

  return (
    <View style={styles.container}>
      {createElement('iframe', {
        title: 'Assigned complaint map',
        srcDoc: mapDocument,
        style: { width: '100%', height: '100%', border: 0 },
        sandbox: 'allow-scripts allow-same-origin',
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#E8EDF4',
  },
});
