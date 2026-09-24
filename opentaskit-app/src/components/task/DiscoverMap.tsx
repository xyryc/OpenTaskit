import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import { Crosshair, Plus, Minus } from 'lucide-react-native';

import type { Task } from '@/types';
import { money } from '@/utils/format';
import { shadows } from '@/utils/shadows';

interface DiscoverMapProps {
  tasks: Task[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onRecenter?: () => void;
  userCoords?: { lat: number; lng: number };
  radiusKm?: number;
}

const CARTO_API_KEY = process.env.EXPO_PUBLIC_CARTO_API_KEY || 'cb1_3wdf_1_9954bb9dda77633eb8b15ed4';

export function DiscoverMap({
  tasks,
  selectedId,
  onSelect,
  onRecenter,
  userCoords,
  radiusKm = 15,
}: DiscoverMapProps) {
  const webViewRef = useRef<WebView>(null);
  const centerLat = userCoords?.lat ?? 6.9271;
  const centerLng = userCoords?.lng ?? 79.8612;

  // Convert tasks to geo markers centered around Colombo (6.9271, 79.8612)
  const mapTasks = tasks.map((t) => {
    // Use the task's real coordinates when available; otherwise fall back to
    // projecting the stylized pin.x/pin.y (0-100) onto the Colombo area.
    const hasRealCoords = typeof t.latitude === 'number' && typeof t.longitude === 'number';
    const lat = hasRealCoords ? t.latitude! : 6.950 - ((t.pin?.y ?? 50) / 100) * 0.05;
    const lng = hasRealCoords ? t.longitude! : 79.840 + ((t.pin?.x ?? 50) / 100) * 0.05;
    return {
      id: t.id,
      title: t.title,
      budget: t.budget,
      categoryId: t.categoryId,
      lat,
      lng,
    };
  });

  const tasksJson = JSON.stringify(mapTasks);

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
      background: #EBF0F2;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .leaflet-control-attribution {
      display: none !important;
    }
    .price-pin {
      background: #FFFFFF;
      color: #0C1417;
      padding: 6px 10px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: -0.2px;
      box-shadow: 0 2px 8px rgba(12, 20, 23, 0.08), 0 1px 2px rgba(12, 20, 23, 0.04);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      border: 1.5px solid #E2E7EA;
      white-space: nowrap;
      cursor: pointer;
      transition: transform 0.15s ease, background-color 0.15s ease;
    }
    .price-pin.active {
      background: #0094F7;
      color: #FFFFFF;
      border-color: #0072C4;
      transform: scale(1.12);
      box-shadow: 0 4px 14px rgba(0, 148, 247, 0.28);
      z-index: 1000 !important;
    }
    .user-pulse {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #0094F7;
      border: 3px solid #FFFFFF;
      box-shadow: 0 0 0 5px rgba(0, 148, 247, 0.20);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([${centerLat}, ${centerLng}], 14);

    // CARTO Positron Light Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png?key=' + encodeURIComponent('${CARTO_API_KEY}'), {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);

    // User location marker
    var userIcon = L.divIcon({
      className: '',
      html: '<div class="user-pulse"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    var userMarker = L.marker([${centerLat}, ${centerLng}], { icon: userIcon }).addTo(map);

    // Filter Radius Circle Overlay
    var initialRadiusKm = ${typeof radiusKm === 'number' && radiusKm > 0 ? radiusKm : 15};
    var radiusCircle = L.circle([${centerLat}, ${centerLng}], {
      radius: initialRadiusKm * 1000,
      color: '#0094F7',
      weight: 2,
      opacity: 0.85,
      dashArray: '6, 6',
      fillColor: '#0094F7',
      fillOpacity: 0.08,
      interactive: false
    }).addTo(map);

    try {
      map.fitBounds(radiusCircle.getBounds(), { padding: [36, 36], maxZoom: 15 });
    } catch (e) {}

    var markersLayer = L.layerGroup().addTo(map);
    var tasks = ${tasksJson};
    var currentSelectedId = ${selectedId ? `'${selectedId}'` : 'null'};

    function renderMarkers() {
      markersLayer.clearLayers();
      tasks.forEach(function(task) {
        var isSelected = task.id === currentSelectedId;
        var formattedPrice = 'Rs ' + task.budget.toLocaleString();
        
        var icon = L.divIcon({
          className: '',
          html: '<div class="price-pin ' + (isSelected ? 'active' : '') + '">' + formattedPrice + '</div>',
          iconSize: [84, 32],
          iconAnchor: [42, 16]
        });

        var marker = L.marker([task.lat, task.lng], { icon: icon });
        marker.on('click', function() {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'taskSelect', id: task.id }));
          }
        });
        markersLayer.addLayer(marker);
      });
    }

    renderMarkers();

    window.updateSelected = function(newId) {
      currentSelectedId = newId;
      renderMarkers();
    };

    window.recenterMap = function() {
      if (radiusCircle) {
        map.fitBounds(radiusCircle.getBounds(), { padding: [36, 36], maxZoom: 15, animate: true });
      } else {
        map.setView([${centerLat}, ${centerLng}], 14, { animate: true });
      }
    };

    window.updateRadius = function(newRadiusKm) {
      if (radiusCircle && typeof newRadiusKm === 'number' && newRadiusKm > 0) {
        radiusCircle.setRadius(newRadiusKm * 1000);
        try {
          map.fitBounds(radiusCircle.getBounds(), { padding: [36, 36], maxZoom: 15, animate: true });
        } catch (e) {}
      }
    };

    window.updateUserLocation = function(newLat, newLng) {
      if (userMarker) {
        userMarker.setLatLng([newLat, newLng]);
      }
      if (radiusCircle) {
        radiusCircle.setLatLng([newLat, newLng]);
      }
    };

    window.updateTasks = function(newTasks) {
      tasks = newTasks;
      renderMarkers();
    };

    window.zoomIn = function() {
      map.zoomIn();
    };

    window.zoomOut = function() {
      map.zoomOut();
    };
  </script>
</body>
</html>
  `;

  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `if (window.updateSelected) { window.updateSelected(${
          selectedId ? `'${selectedId}'` : 'null'
        }); } true;`
      );
    }
  }, [selectedId]);

  useEffect(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(
        `if (window.updateTasks) { window.updateTasks(${tasksJson}); } true;`
      );
    }
  }, [tasksJson]);

  useEffect(() => {
    if (webViewRef.current && typeof radiusKm === 'number') {
      webViewRef.current.injectJavaScript(
        `if (window.updateRadius) { window.updateRadius(${radiusKm}); } true;`
      );
    }
  }, [radiusKm]);

  useEffect(() => {
    if (webViewRef.current && userCoords) {
      webViewRef.current.injectJavaScript(
        `if (window.updateUserLocation) { window.updateUserLocation(${userCoords.lat}, ${userCoords.lng}); } true;`
      );
    }
  }, [userCoords?.lat, userCoords?.lng]);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'taskSelect') {
        onSelect(data.id);
      }
    } catch (e) {
      console.warn('Map message parse error', e);
    }
  };

  const handleRecenter = () => {
    webViewRef.current?.injectJavaScript('window.recenterMap(); true;');
    if (onRecenter) onRecenter();
  };

  const handleZoomIn = () => {
    webViewRef.current?.injectJavaScript('window.zoomIn(); true;');
  };

  const handleZoomOut = () => {
    webViewRef.current?.injectJavaScript('window.zoomOut(); true;');
  };

  return (
    <View className="relative flex-1 w-full h-full bg-[#EBF0F2]">
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={StyleSheet.absoluteFill}
        onMessage={handleMessage}
        scrollEnabled={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
      />

      {/* Floating Radius Indicator Badge */}
      <View
        className="absolute left-4 top-4 flex-row items-center gap-1.5 rounded-full border border-white/80 bg-white/95 px-3 py-1.5 backdrop-blur-md"
        style={shadows.subtle}
      >
        <View className="h-2 w-2 rounded-full bg-[#0094F7]" />
        <Text className="font-geist-medium text-[12px] text-ink">
          Radius: {radiusKm} km
        </Text>
      </View>

      {/* Floating Map Controls in Top Right */}
      <View
        className="absolute right-4 top-4 gap-2"
        style={{ gap: 8 }}
      >
        {/* Zoom Controls */}
        <View
          className="overflow-hidden rounded-2xl border border-ink-200 bg-white/95 backdrop-blur"
          style={shadows.subtle}
        >
          <Pressable
            onPress={handleZoomIn}
            className="h-10 w-10 items-center justify-center active:bg-ink-100"
          >
            <Plus size={18} color="#2B3A41" />
          </Pressable>
          <View className="h-[1px] bg-ink-200" />
          <Pressable
            onPress={handleZoomOut}
            className="h-10 w-10 items-center justify-center active:bg-ink-100"
          >
            <Minus size={18} color="#2B3A41" />
          </Pressable>
        </View>

        {/* Recenter Button */}
        <Pressable
          onPress={handleRecenter}
          className="h-10 w-10 items-center justify-center rounded-2xl border border-ink-200 bg-white/95 active:bg-ink-100"
          style={shadows.subtle}
        >
          <Crosshair size={18} color="#2B3A41" />
        </Pressable>
      </View>
    </View>
  );
}
