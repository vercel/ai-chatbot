'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

interface GoogleMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  showStreetView?: boolean;
}

export function GoogleMap({ center, zoom = 20, showStreetView = false }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const streetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!(window as any).google || !mapRef.current) return;
    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      mapTypeId: google.maps.MapTypeId.SATELLITE,
    });

    if (showStreetView && streetRef.current) {
      new google.maps.StreetViewPanorama(streetRef.current, {
        position: center,
        pov: { heading: 0, pitch: 0 },
      });
    }
  }, [center, zoom, showStreetView]);

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
        strategy="lazyOnload"
      />
      <div ref={mapRef} className="h-64 w-full" />
      {showStreetView && <div ref={streetRef} className="mt-2 h-64 w-full" />}
    </>
  );
}

export async function geocodeAddress(addr: string) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error('Google Maps API key not configured');
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addr)}&key=${key}`,
  );
  const data = await res.json();
  if (data.status !== 'OK' || !data.results[0]) {
    throw new Error('Endereço não encontrado');
  }
  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
}

export async function reverseGeocode(lat: number, lng: number) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) throw new Error('Google Maps API key not configured');
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`,
  );
  const data = await res.json();
  if (data.status !== 'OK' || !data.results[0]) {
    throw new Error('Endereço não encontrado');
  }
  return data.results[0].formatted_address as string;
}
