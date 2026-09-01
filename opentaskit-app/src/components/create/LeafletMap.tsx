import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { MapPin } from 'lucide-react-native';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface LeafletMapProps {
  initialCenter?: Coordinates;
  initialZoom?: number;
  onCenterChange?: (coords: Coordinates) => void;
  onMoveStart?: () => void;
  height?: number;
}

const DEFAULT_CENTER: Coordinates = {
  lat: 6.9271,
  lng: 79.8612, // Colombo, Sri Lanka
};

export function LeafletMap({
  initialCenter = DEFAULT_CENTER,
  initialZoom = 14,
  onCenterChange,
  onMoveStart,
  height = 240,
}: LeafletMapProps) {
  const webViewRef = useRef<WebView>(null);
  const [isMoving, setIsMoving] = useState(false);

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      background: #f4f6f7;
    }
    .leaflet-control-attribution {
      display: none !important;
    }
    .leaflet-bar {
      border: none !important;
      box-shadow: 0 2px 6px rgba(0,0,0,0.12) !important;
      border-radius: 8px !important;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${initialCenter.lat}, ${initialCenter.lng}], ${initialZoom});

    // CARTO Positron Light Tiles (Clean, modern aesthetic)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    window.map = map;

    map.on('movestart', function() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'moveStart' }));
      }
    });

    map.on('moveend', function() {
      var center = map.getCenter();
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'moveEnd',
          lat: center.lat,
          lng: center.lng
        }));
      }
    });
  </script>
</body>
</html>
  `;

  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.map) {
          window.map.setView([${initialCenter.lat}, ${initialCenter.lng}], window.map.getZoom() || ${initialZoom});
        }
        true;
      `);
    }
  }, [initialCenter.lat, initialCenter.lng, initialZoom]);

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'moveStart') {
          setIsMoving(true);
          onMoveStart?.();
        } else if (data.type === 'moveEnd') {
          setIsMoving(false);
          onCenterChange?.({ lat: data.lat, lng: data.lng });
        }
      } catch (e) {
        console.error('Error parsing webview message:', e);
      }
    },
    [onCenterChange, onMoveStart]
  );

  return (
    <View style={[{ height }, styles.container]}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webView}
        onMessage={handleMessage}
        scrollEnabled={false}
        overScrollMode="never"
        javaScriptEnabled={true}
        domStorageEnabled={true}
        nestedScrollEnabled={true}
      />

      {/* Center Pin Marker with Lift Animation on Drag */}
      <View
        pointerEvents="none"
        style={[
          styles.pinWrapper,
          {
            transform: [{ translateY: isMoving ? -14 : -6 }],
          },
        ]}
      >
        <View style={styles.pinShadow} />
        <MapPin size={38} color="#0094F7" fill="#0094F7" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E7E9',
    position: 'relative',
    backgroundColor: '#F4F6F7',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  pinWrapper: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -19,
    marginTop: -38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinShadow: {
    position: 'absolute',
    bottom: -2,
    width: 8,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(12, 20, 23, 0.25)',
  },
});
