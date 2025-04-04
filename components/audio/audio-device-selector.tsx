'use client';

import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Mic } from 'lucide-react';
import { enumerateAudioDevices } from '@/lib/audio-utils';

export interface AudioDevice {
  deviceId: string;
  label: string;
  isDefault: boolean;
}

interface AudioDeviceSelectorProps {
  disabled?: boolean;
  selectedDeviceId: string;
  onDeviceChange: (deviceId: string) => void;
}

export function AudioDeviceSelector({
  disabled = false,
  selectedDeviceId,
  onDeviceChange
}: AudioDeviceSelectorProps) {
  const [audioDevices, setAudioDevices] = useState<AudioDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load available audio input devices
  useEffect(() => {
    const loadDevices = async () => {
      setIsLoading(true);
      try {
        // Get all audio devices
        const devices = await enumerateAudioDevices();
        
        // Format as AudioDevice objects for the selector
        const inputDevices = devices.inputs.map(device => ({
          deviceId: device.deviceId,
          label: device.label || 'Unnamed microphone',
          isDefault: device.deviceId === 'default'
        }));

        setAudioDevices(inputDevices);
        
        // If no device is selected yet, choose the default or first available device
        if (!selectedDeviceId && inputDevices.length > 0) {
          // Try to find the default device first
          const defaultDevice = inputDevices.find(d => d.isDefault);
          
          // Or find a real microphone (not virtual devices)
          const realMicrophone = inputDevices.find(d => 
            !d.label.toLowerCase().includes('blackhole') && 
            !d.label.toLowerCase().includes('virtual') &&
            (d.label.toLowerCase().includes('mic') || 
             d.label.toLowerCase().includes('microphone'))
          );
          
          // If we found a good device, select it
          if (defaultDevice) {
            onDeviceChange(defaultDevice.deviceId);
          } else if (realMicrophone) {
            onDeviceChange(realMicrophone.deviceId);
          } else if (inputDevices.length > 0) {
            // Otherwise use the first device
            onDeviceChange(inputDevices[0].deviceId);
          }
        }
      } catch (error) {
        console.error('Error loading audio devices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDevices();
  }, [onDeviceChange, selectedDeviceId]);

  // Handle device selection change
  const handleDeviceChange = (value: string) => {
    onDeviceChange(value);
  };

  // Determine if we should show default or real device names
  const getDeviceLabel = (device: AudioDevice) => {
    if (device.isDefault) {
      return `Default - ${device.label}`;
    }
    return device.label;
  };

  return (
    <div className="flex flex-col space-y-2 mb-4">
      <div className="flex items-center gap-2">
        <Mic className="h-4 w-4" />
        <Label htmlFor="microphone-select">Select Microphone</Label>
      </div>
      
      <Select 
        value={selectedDeviceId} 
        onValueChange={handleDeviceChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger id="microphone-select" className="w-full">
          <SelectValue placeholder={isLoading ? "Loading devices..." : "Select a microphone"} />
        </SelectTrigger>
        <SelectContent>
          {audioDevices.map((device) => (
            <SelectItem key={device.deviceId} value={device.deviceId}>
              {getDeviceLabel(device)}
            </SelectItem>
          ))}
          {audioDevices.length === 0 && (
            <SelectItem value="none" disabled>
              No microphones found
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      
      {selectedDeviceId && audioDevices.find(d => d.deviceId === selectedDeviceId)?.label.toLowerCase().includes('blackhole') && (
        <p className="text-xs text-amber-600">
          Warning: You've selected a virtual audio device. This may not record from your actual microphone.
        </p>
      )}
    </div>
  );
}
