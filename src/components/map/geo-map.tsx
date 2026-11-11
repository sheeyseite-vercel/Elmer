"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";
import { BAND_TEXT, type Band } from "@/lib/analytics/geo";

export type MapPoint = {
  key: string;
  lat: number;
  lng: number;
  label: string;
  position: number | null;
  depth: number;
  band: Band;
  checkedAtText: string;
  methodology: string;
  checksAtPoint: number;
};

export type MapData = {
  clinic: { lat: number; lng: number; name: string } | null;
  points: MapPoint[];
  surface: "maps" | "search";
  surfaceLabel: string;
  keyword: string;
};

/**
 * OpenStreetMap via Leaflet. Pins show the observed position as text and use a different shape per
 * surface (round = Google Maps, square = Google Search), so colour is never the only signal.
 * Popup text is built with textContent, never HTML, because it contains owner-entered text.
 */
export function GeoMap({ data }: { data: MapData }) {
  const ref = useRef<HTMLDivElement>(null);
  const json = useMemo(() => JSON.stringify(data), [data]);

  useEffect(() => {
    const d = JSON.parse(json) as MapData;
    let map: import("leaflet").Map | undefined;
    let cancelled = false;

    (async () => {
      const mod = (await import("leaflet")) as unknown as { default?: typeof import("leaflet") } & typeof import("leaflet");
      const L = mod.default ?? mod;
      if (cancelled || !ref.current) return;

      map = L.map(ref.current, { scrollWheelZoom: false });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const bounds: [number, number][] = [];
      const line = (parent: HTMLElement, text: string, bold = false) => {
        const el = document.createElement(bold ? "strong" : "div");
        el.textContent = text;
        parent.appendChild(el);
      };

      if (d.clinic) {
        const icon = L.divIcon({ className: "", html: '<div class="elmer-pin clinic" aria-hidden="true">★</div>', iconSize: [34, 34], iconAnchor: [17, 17] });
        const pop = document.createElement("div");
        line(pop, d.clinic.name, true);
        line(pop, "Confirmed business location");
        L.marker([d.clinic.lat, d.clinic.lng], { icon, title: d.clinic.name }).addTo(map).bindPopup(pop);
        bounds.push([d.clinic.lat, d.clinic.lng]);
      }

      for (const p of d.points) {
        const text = p.position === null ? "–" : String(p.position);
        const icon = L.divIcon({
          className: "",
          html: `<div class="elmer-pin ${p.band} ${d.surface}" aria-hidden="true">${text}</div>`, // text is a number or "–"
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });
        const pop = document.createElement("div");
        line(pop, p.label, true);
        line(pop, p.position === null ? `Not found in top ${p.depth} checked` : `Position ${p.position}`);
        line(pop, `${d.surfaceLabel} · ${d.keyword}`);
        line(pop, `Checked: ${p.checkedAtText}`);
        line(pop, "Source: manually recorded");
        line(pop, `Method: ${p.methodology}`);
        if (p.checksAtPoint > 1) line(pop, `Showing the newest of ${p.checksAtPoint} checks here`);
        L.marker([p.lat, p.lng], { icon, title: `${p.label}: ${BAND_TEXT[p.band]}` }).addTo(map).bindPopup(pop);
        bounds.push([p.lat, p.lng]);
      }

      if (bounds.length > 1) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
      else if (bounds[0]) map.setView(bounds[0], 15);
      else map.setView([40.4168, -3.7038], 6); // Spain overview, only when nothing can be placed
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [json]);

  return (
    <div
      ref={ref}
      role="region"
      aria-label={`Map of ${data.surfaceLabel} rank checks for ${data.keyword}. A table with the same information follows.`}
      className="isolate h-[360px] w-full overflow-hidden rounded-card border border-border"
    />
  );
}
