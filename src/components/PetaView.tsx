import React, { useEffect, useRef, useState } from 'react';
import { PenerimaHuntap } from '../types';
import { Compass, Layers, Minimize2, Navigation } from 'lucide-react';

interface PetaViewProps {
  data: PenerimaHuntap[];
  focusId: string | null;
}

export default function PetaView({ data, focusId }: PetaViewProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any | null>(null);
  const markersGroupRef = useRef<any | null>(null);
  const mapType = 'hybrid';

  // Parse list of coordinates
  const points = data
    .map((item) => {
      const parts = item.koordinat?.replace(/\s/g, '').split(',');
      if (parts && parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lng)) {
          return { ...item, lat, lng };
        }
      }
      return null;
    })
    .filter((p) => p !== null) as (PenerimaHuntap & { lat: number; lng: number })[];

  // Initialize Map
  useEffect(() => {
    // If browser doesn't load window.L, skip
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    // Clean up old instance if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Set Default Bima, NTB center coordinate
    const centerLat = -8.505;
    const centerLng = 118.606;
    const defaultZoom = 11;

    // Initialize Map Instance
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([centerLat, centerLng], defaultZoom);

    mapInstanceRef.current = map;

    // Add controls
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Initial base layer tiles
    const tileUrl =
      mapType === 'hybrid'
        ? 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const subdomains = mapType === 'hybrid' ? ['mt0', 'mt1', 'mt2', 'mt3'] : ['a', 'b', 'c'];

    L.tileLayer(tileUrl, {
      maxZoom: 20,
      subdomains: subdomains,
    }).addTo(map);

    // Markers layer group
    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    // Clean up maps on destruction
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [mapType]);

  // Plots Markers
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!L || !map || !markersGroup) return;

    markersGroup.clearLayers();

    points.forEach((item) => {
      const isSudah = item.terimaSertipikat === 'Sudah';
      const color = isSudah ? '#10b981' : '#f5a623';

      // HTML custom circular marker pins
      const markerHtml = `
        <div style="
          width: 18px; 
          height: 18px; 
          background-color: ${color}; 
          border: 3.5px solid #ffffff; 
          border-radius: 50%; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.5); 
          position: relative; 
          display: flex; 
          align-items: center; 
          justify-content: center;
        ">
          ${
            !isSudah
              ? `<span style="
                  position: absolute; 
                  width: 32px; 
                  height: 32px; 
                  background-color: ${color}; 
                  border-radius: 50%; 
                  opacity: 0.15; 
                  animation: p-ping 1.5s infinite ease-in-out;
                  z-index: -1;
                "></span>`
              : ''
          }
        </div>
        <style>
          @keyframes p-ping {
            0% { transform: scale(0.5); opacity: 0.3; }
            100% { transform: scale(1.6); opacity: 0; }
          }
        </style>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      // Simple Popup body card inside map
      const popupHtml = `
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; color: #1e293b; padding: 2px; min-width: 170px;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 5px;">
            <b style="font-size: 13px; color: #0f172a;">Rumah ${item.nomorRumah}</b>
            <span style="font-size: 9px; font-weight:800; padding: 2px 6px; border-radius: 99px; background: ${
              isSudah ? '#d1fae5' : '#fef3c7'
            }; color: ${isSudah ? '#10b981' : '#f5a623'};">
              ${item.terimaSertipikat} SHM
            </span>
          </div>
          <div style="font-size: 11px; font-weight:700; color: #334155;">${item.nama}</div>
          <div style="font-size: 9px; color: #64748b; margin-top: 2px;">Desa ${item.desa}, Kec. ${
            item.kecamatan
          }</div>
          ${
            item.fotoRumah
              ? `<div style="margin-top: 6px;"><img src="${item.fotoRumah}" style="width: 100%; height: 60px; object-fit:cover; border-radius: 6px; border:1px solid #cbd5e1" /></div>`
              : ''
          }
        </div>
      `;

      L.marker([item.lat, item.lng], { icon: customIcon }).bindPopup(popupHtml).addTo(markersGroup);
    });
  }, [points]);

  // Center maps on targeted Focus coordinates
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map || !focusId) return;

    const targetItem = points.find((p) => p.id === focusId);
    if (targetItem) {
      map.flyTo([targetItem.lat, targetItem.lng], 18, {
        duration: 1.5,
        easeLinearity: 0.25,
      });

      // Auto pop open the targeted coordinates
      setTimeout(() => {
        // Look up registered markers
        map.eachLayer((layer: any) => {
          if (layer instanceof L.Marker) {
            const pos = layer.getLatLng();
            if (
              Math.abs(pos.lat - targetItem.lat) < 0.0001 &&
              Math.abs(pos.lng - targetItem.lng) < 0.0001
            ) {
              layer.openPopup();
            }
          }
        });
      }, 1600);
    }
  }, [focusId]);

  const handleResetMapCamera = () => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([-8.505, 118.606], 11, { duration: 1 });
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Map Header Card */}
      <div className="bg-slate-800/60 border border-slate-750 p-3.5 rounded-2xl shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-teal-500/10 text-teal-400 p-2 rounded-xl">
            <Navigation className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <span className="text-slate-100 text-xs font-black">Peta Huntap</span>
          </div>
        </div>

        <div className="flex gap-1.5">
          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wide flex items-center gap-1">
            <Layers className="w-3 h-3 text-emerald-400 animate-pulse" />
            Satelit Aktif
          </span>
          <button
            onClick={handleResetMapCamera}
            className="bg-slate-800 border border-slate-700/60 hover:bg-slate-750 text-slate-300 p-1.5 rounded-xl cursor-pointer"
            title="Reset Kamera"
          >
            <Minimize2 className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Map Node Container (Square physical aspect frame) */}
      <div className="relative shadow-lg rounded-2xl overflow-hidden border border-slate-750 bg-slate-950 w-full aspect-square">
        <div className="w-full h-full" ref={mapContainerRef}></div>
      </div>

      {/* Attributes & Legend Panel underneath (Fully scannable, won't overlap!) */}
      <div className="bg-slate-800 border border-slate-750/80 p-4 rounded-2xl shadow-md space-y-3">
        <h5 className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Keterangan Atribut Peta</h5>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-750/60 flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white shrink-0 shadow-sm"></span>
            <div>
              <p className="text-[10px] font-black text-emerald-400 uppercase leading-none">Sudah SHM</p>
              <p className="text-[9px] text-slate-400 mt-1">Telah Ber-sertipikat</p>
            </div>
          </div>

          <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-750/60 flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white shrink-0 shadow-sm animate-pulse"></span>
            <div>
              <p className="text-[10px] font-black text-amber-500 uppercase leading-none">Belum SHM</p>
              <p className="text-[9px] text-slate-400 mt-1">Penerimaan Tertunda</p>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-750/60 pt-2.5 flex items-start gap-1.5">
          <span className="w-1.5 h-1.5 bg-teal-400 rounded-full mt-1 shrink-0"></span>
          <span>Tekan pin bundar pada peta satelit di atas untuk memunculkan pop-up detail pemilik dan nomor rumah Huntap.</span>
        </div>
      </div>
    </div>
  );
}
