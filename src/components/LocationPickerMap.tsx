import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface Location {
  lat: number;
  lng: number;
}

interface LocationPickerMapProps {
  onLocationSelect: (loc: Location | null) => void;
  selectedLocation: Location | null;
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
        .leaflet-popup-content-wrapper { border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map', { zoomControl: false }).setView([23.8103, 90.4125], 11); // Dhaka center
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        var currentMarker = null;

        var svgIcon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="#EF4444"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>';
        var customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='display:flex; justify-content:center; align-items:center; background-color:transparent;'>" + svgIcon + "</div>",
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });

        map.on('click', function(e) {
            if (currentMarker) {
                map.removeLayer(currentMarker);
            }
            currentMarker = L.marker([e.latlng.lat, e.latlng.lng], { icon: customIcon }).addTo(map);
            window.ReactNativeWebView.postMessage(JSON.stringify({ lat: e.latlng.lat, lng: e.latlng.lng }));
        });

        function clearMarker() {
            if (currentMarker) {
                map.removeLayer(currentMarker);
                currentMarker = null;
            }
        }
        
        window.clearMarker = clearMarker;
    </script>
</body>
</html>
`;

export default function LocationPickerMap({ onLocationSelect, selectedLocation }: LocationPickerMapProps) {
  const webviewRef = useRef<WebView>(null);

  React.useEffect(() => {
    if (!selectedLocation && webviewRef.current) {
      webviewRef.current.injectJavaScript('if(window.clearMarker) { window.clearMarker(); } true;');
    }
  }, [selectedLocation]);

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
            const data = JSON.parse(event.nativeEvent.data);
            if (data.lat && data.lng) {
              onLocationSelect(data);
            }
          } catch (e) {
            console.error('Error parsing message from webview', e);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E8EDF4',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  }
});
