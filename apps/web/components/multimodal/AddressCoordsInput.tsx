'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { geocodeAddress, reverseGeocode } from './GoogleMap';

interface AddressCoordsInputProps {
  onCenterMap: (coords: { lat: number; lng: number }) => void;
  onStartDetection: (coords: { lat: number; lng: number }) => void;
}

export function AddressCoordsInput({
  onCenterMap,
  onStartDetection,
}: AddressCoordsInputProps) {
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [useReverse, setUseReverse] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateCoords = (la: number, lo: number) => {
    return la >= -90 && la <= 90 && lo >= -180 && lo <= 180;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    let coords: { lat: number; lng: number } | null = null;
    try {
      if (address && !(lat && lng)) {
        coords = await geocodeAddress(address);
        setLat(String(coords.lat));
        setLng(String(coords.lng));
      } else if (lat && lng) {
        const la = Number.parseFloat(lat);
        const lo = Number.parseFloat(lng);
        if (!validateCoords(la, lo)) {
          throw new Error('Coordenadas inválidas');
        }
        coords = { lat: la, lng: lo };
        if (useReverse && !address) {
          try {
            const addr = await reverseGeocode(la, lo);
            setAddress(addr);
          } catch {}
        }
      } else {
        throw new Error('Informe endereço ou coordenadas');
      }
      if (coords) {
        onCenterMap(coords);
        onStartDetection(coords);
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Input
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Endereço"
        aria-label="Endereço"
      />
      <div className="flex gap-2">
        <Input
          type="number"
          inputMode="decimal"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder="Latitude"
          min="-90"
          max="90"
          step="any"
          aria-label="Latitude"
        />
        <Input
          type="number"
          inputMode="decimal"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          placeholder="Longitude"
          min="-180"
          max="180"
          step="any"
          aria-label="Longitude"
        />
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="reverse-geocode"
          checked={useReverse}
          onCheckedChange={setUseReverse}
        />
        <Label htmlFor="reverse-geocode">Geocode reverso</Label>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
      <Button type="submit">Buscar</Button>
    </form>
  );
}

