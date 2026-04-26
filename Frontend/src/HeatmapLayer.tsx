import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

type HeatmapLayerProps = {
  points: Array<[number, number, number]>; // [latitudine, longitudine, intensitate]
};

export default function HeatmapLayer({ points }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Folosim "as any" pentru a evita erori de TypeScript dacă tipurile librăriei întârzie să se încarce
    const heatLayer = (L as any).heatLayer(points, {
      radius: 35, // Cât de mare să fie "pata" de căldură pentru un incident
      blur: 20, // Cât de difuză să fie marginea
      maxZoom: 15, // Zoom-ul la care intensitatea atinge maximul
      gradient: {
        0.4: "blue", // Zone reci (puține incidente)
        0.6: "cyan",
        0.7: "lime",
        0.8: "yellow",
        1.0: "red", // Zone fierbinți (multe incidente concentrate)
      },
    });

    heatLayer.addTo(map);

    // Funcția de curățare: când dezactivăm heatmap-ul, îl ștergem de pe hartă
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null; // Această componentă nu randează elemente HTML vizibile, ci modifică harta DOM
}
