import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export interface ComplaintLocation {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  status: string;
}

interface MapViewProps {
  locations: ComplaintLocation[];
  onLocationPress?: (location: ComplaintLocation) => void;
}

const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { padding: 0; margin: 0; background-color: #E8EDF4; }
        html, body, #map { height: 100%; width: 100%; }
        .popup-title { font-family: sans-serif; font-weight: bold; font-size: 14px; margin-bottom: 4px; color: #111827; }
        .popup-desc { font-family: sans-serif; font-size: 12px; color: #555; margin-bottom: 6px; line-height: 1.4; }
        .popup-status { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; font-family: sans-serif; margin-bottom: 6px; }
        .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map', { zoomControl: false }).setView([23.8103, 90.4125], 11); // Dhaka center
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" style="font-size: 10px;">OpenStreetMap</a>'
        }).addTo(map);

        var markers = [];

        function setMarkers(data) {
            // Remove existing markers
            markers.forEach(m => map.removeLayer(m));
            markers = [];

            if (!data || data.length === 0) return;

            var bounds = L.latLngBounds();

            data.forEach(function(item) {
                var statusColor = '#333';
                var statusBg = '#eee';
                if (item.status.toUpperCase() === 'PENDING') { 
                    statusColor = '#EF4444'; statusBg = '#FEF2F2'; 
                } else if (item.status.toUpperCase() === 'IN PROGRESS') { 
                    statusColor = '#C67B00'; statusBg = '#FEF9C3'; 
                } else if (item.status.toUpperCase() === 'RESOLVED') { 
                    statusColor = '#2563EB'; statusBg = '#EFF6FF'; 
                }

                var svgIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="' + statusColor + '"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';

                var customIcon = L.divIcon({
                    className: 'custom-div-icon',
                    html: "<div style='display:flex; justify-content:center; align-items:center; background-color:transparent;'>" + svgIcon + "</div>",
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -32]
                });

                var marker = L.marker([item.lat, item.lng], { icon: customIcon }).addTo(map);
                marker.on('click', function() {
                    if (window.ReactNativeWebView) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'complaint-marker',
                            id: item.id
                        }));
                    }
                });

                var popupContent = '<div class="popup-title">' + item.title + '</div>' +
                                   '<div class="popup-status" style="color:' + statusColor + '; background:' + statusBg + ';">' + item.status + '</div>' +
                                   '<div class="popup-desc">' + item.description + '</div>';
                
                marker.bindPopup(popupContent);
                markers.push(marker);
                bounds.extend([item.lat, item.lng]);
            });

            if (markers.length > 0) {
                map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
            }
        }
        
        // Expose function to global scope for injectJavaScript
        window.setMarkers = setMarkers;
    </script>
</body>
</html>
`;

export default function MapViewComponent({ locations, onLocationPress }: MapViewProps) {
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    if (webviewRef.current && locations.length > 0) {
      const script = `if(window.setMarkers) { window.setMarkers(${JSON.stringify(locations)}); } true;`;
      webviewRef.current.injectJavaScript(script);
    }
  }, [locations]);

  return (
    <View style={styles.container}>
      <WebView 
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }} 
        style={styles.webview}
        nestedScrollEnabled={true}
        overScrollMode="never"
        javaScriptEnabled={true}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data) as {
              type?: string;
              id?: string;
            };
            if (message.type !== 'complaint-marker' || !message.id) return;
            const location = locations.find((item) => item.id === message.id);
            if (location) onLocationPress?.(location);
          } catch {
            // Ignore messages that are not produced by the complaint map.
          }
        }}
        onLoadEnd={() => {
          const script = `if(window.setMarkers) { window.setMarkers(${JSON.stringify(locations)}); } true;`;
          webviewRef.current?.injectJavaScript(script);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#E8EDF4',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  }
});
