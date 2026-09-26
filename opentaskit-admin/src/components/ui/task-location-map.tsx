"use client";

import * as React from "react";
import { ExternalLink, Globe, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface TaskLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  title?: string;
  isRemote?: boolean;
  height?: number | string;
  className?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function TaskLocationMap({
  latitude,
  longitude,
  address,
  title,
  isRemote = false,
  height = 240,
  className = "",
}: TaskLocationMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<any>(null);

  const hasCoordinates =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    !isNaN(latitude) &&
    !isNaN(longitude);

  React.useEffect(() => {
    if (!hasCoordinates || isRemote || !mapContainerRef.current) {
      return;
    }

    let isSubscribed = true;

    async function initLeaflet() {
      const L = (await import("leaflet")).default;

      if (!isSubscribed || !mapContainerRef.current) return;

      // Clean up existing map instance if container was reused
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Initialize Leaflet Map
      const map = L.map(mapContainerRef.current, {
        center: [latitude!, longitude!],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
      });

      // Esri World Street Map — 100% free, zero API key required, high-detail streets
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 19,
          attribution: "Tiles &copy; Esri",
        }
      ).addTo(map);

      // Add Zoom Control at bottom right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Custom Branded SVG Pin Icon
      const pinIcon = L.divIcon({
        className: "custom-task-pin",
        html: `
          <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="width: 30px; height: 30px; background-color: #2563eb; border: 2.5px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 12px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center;">
              <div style="width: 10px; height: 10px; background-color: #ffffff; border-radius: 50%; transform: rotate(45deg);"></div>
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([latitude!, longitude!], { icon: pinIcon }).addTo(map);

      const popupHtml = `
        <div style="font-family: inherit; font-size: 11px; color: #1e293b; max-width: 220px; padding: 2px;">
          <strong style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 2px; color: #0f172a;">
            ${escapeHtml(title || "Task Location")}
          </strong>
          <span style="display: block; color: #475569; font-size: 11px; line-height: 1.3;">
            ${escapeHtml(address || "Pinned Location")}
          </span>
          <div style="margin-top: 5px; font-size: 10px; color: #64748b; font-family: monospace;">
            ${latitude!.toFixed(5)}, ${longitude!.toFixed(5)}
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      mapInstanceRef.current = map;

      // Invalidate map size after render / modal animation settles
      const resizeTimer = setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 250);

      return () => {
        clearTimeout(resizeTimer);
      };
    }

    initLeaflet();

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hasCoordinates, latitude, longitude, address, title, isRemote]);

  const containerHeight = typeof height === "number" ? `${height}px` : height;

  // Handle Remote / Online Tasks
  if (isRemote) {
    return (
      <div
        style={{ height: containerHeight }}
        className={`w-full rounded-xl border border-dashed border-border/80 bg-muted/20 flex flex-col items-center justify-center p-4 text-center gap-2 ${className}`}
      >
        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
          <Globe className="h-5 w-5" />
        </div>
        <div>
          <span className="text-xs font-semibold text-foreground block">Remote / Online Task</span>
          <span className="text-[11px] text-muted-foreground max-w-[260px] leading-tight block mt-0.5">
            This task is executed online; no physical location or travel is required.
          </span>
        </div>
      </div>
    );
  }

  // Handle In-Person Tasks without pinned GPS coordinates
  if (!hasCoordinates) {
    return (
      <div
        style={{ height: containerHeight }}
        className={`w-full rounded-xl border border-dashed border-border/80 bg-muted/20 flex flex-col items-center justify-center p-4 text-center gap-2 ${className}`}
      >
        <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
          <MapPin className="h-5 w-5" />
        </div>
        <div>
          <span className="text-xs font-semibold text-foreground block">Coordinates Not Pinned</span>
          <span className="text-[11px] text-muted-foreground max-w-[260px] leading-tight block mt-0.5">
            {address ? address : "No specific GPS pin coordinates were provided by the poster."}
          </span>
        </div>
      </div>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <div
      style={{ height: containerHeight }}
      className={`relative w-full rounded-xl overflow-hidden border border-border/70 shadow-xs group ${className}`}
    >
      {/* Interactive Leaflet Map Container */}
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* External Map Shortcut Badge */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2.5 right-2.5 z-1000 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background/90 hover:bg-background text-foreground text-xs font-medium shadow-xs border border-border/80 backdrop-blur-xs transition-colors"
        title="Open in Google Maps (new tab)"
      >
        <span>Open in Google Maps</span>
        <ExternalLink className="h-3 w-3 text-muted-foreground" />
      </a>
    </div>
  );
}
