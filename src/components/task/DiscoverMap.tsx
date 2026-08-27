import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import { Crosshair, Plus, Minus } from 'lucide-react-native';

import type { Task } from '@/types';

interface DiscoverMapProps {
  tasks: Task[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onRecenter?: () => void;
}

export function DiscoverMap({
  tasks,
  selectedId,
  onSelect,
  onRecenter,
}: DiscoverMapProps) {
  const webViewRef = useRef<WebView>(null);

  // Convert tasks to geo markers centered around Colombo (6.9271, 79.8612)
  const mapTasks = tasks.map((t) => {
    // pin.x is 0-100, pin.y is 0-100
    const lat = 6.950 - ((t.pin?.y ?? 50) / 100) * 0.05;
    const lng = 79.840 + ((t.pin?.x ?? 50) / 100) * 0.05;
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
      box-shadow: 0 4px 12px rgba(12, 20, 23, 0.16);
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
      box-shadow: 0 6px 16px rgba(0, 148, 247, 0.35);
      z-index: 1000 !important;
    }
    .user-pulse {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #0094F7;
      border: 3px solid #FFFFFF;
      box-shadow: 0 0 0 6px rgba(0, 148, 247, 0.25);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([6.9271, 79.8612], 14);

    // CARTO Positron Light Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // User location marker
    var userIcon = L.divIcon({
      className: '',
      html: '<div class="user-pulse"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });
    L.marker([6.9271, 79.8612], { icon: userIcon }).addTo(map);

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
      map.setView([6.9271, 79.8612], 14, { animate: true });
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

      {/* Floating Map Controls in Top Right */}
      <View
        className="absolute right-4 top-4 gap-2"
        style={{ gap: 8 }}
      >
        {/* Zoom Controls */}
        <View className="overflow-hidden rounded-2xl border border-ink-200 bg-white/95 shadow-sm backdrop-blur">
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
          className="h-10 w-10 items-center justify-center rounded-2xl border border-ink-200 bg-white/95 shadow-sm active:bg-ink-100"
        >
          <Crosshair size={18} color="#2B3A41" />
        </Pressable>
      </View>
    </View>
  );
}
