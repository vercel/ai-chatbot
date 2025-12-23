/**
 * TiQology Holographic UI Layer
 * WebXR-powered immersive UI with React Three Fiber
 */

"use client";

import { type ReactNode, Suspense, useEffect, useRef, useState } from "react";

export interface HolographicUIProps {
  children?: ReactNode;
  enableVR?: boolean;
  enableAR?: boolean;
  enableHandTracking?: boolean;
  sessionMode?: "immersive-vr" | "immersive-ar" | "inline";
}

export interface XRSession {
  mode: string;
  active: boolean;
  referenceSpace: any;
}

/**
 * Main Holographic UI Container
 * Provides WebXR session management and 3D UI context
 */
export function HolographicUI({
  children,
  enableVR = true,
  enableAR = false,
  enableHandTracking = true,
  sessionMode = "immersive-vr",
}: HolographicUIProps) {
  const [xrSupported, setXrSupported] = useState(false);
  const [session, setSession] = useState<XRSession | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check XR support
    if (typeof navigator !== "undefined" && "xr" in navigator) {
      (navigator as any).xr
        ?.isSessionSupported(sessionMode)
        .then((supported: boolean) => {
          setXrSupported(supported);
        });
    }
  }, [sessionMode]);

  const enterXR = async () => {
    if (!xrSupported) {
      console.warn("XR not supported on this device");
      return;
    }

    try {
      const xrSession = await (navigator as any).xr?.requestSession(
        sessionMode,
        {
          requiredFeatures: ["local-floor"],
          optionalFeatures: enableHandTracking ? ["hand-tracking"] : [],
        }
      );

      const referenceSpace =
        await xrSession.requestReferenceSpace("local-floor");

      setSession({
        mode: sessionMode,
        active: true,
        referenceSpace,
      });

      xrSession.addEventListener("end", () => {
        setSession(null);
      });
    } catch (error) {
      console.error("Failed to enter XR:", error);
    }
  };

  const exitXR = () => {
    setSession(null);
  };

  return (
    <div className="holographic-ui-container h-full w-full" ref={containerRef}>
      {xrSupported && !session && (
        <button
          className="absolute top-4 right-4 z-50 rounded-lg bg-blue-600 px-4 py-2 text-white shadow-lg hover:bg-blue-700"
          onClick={enterXR}
        >
          {enableVR ? "Enter VR" : "Enter AR"}
        </button>
      )}

      {session && (
        <button
          className="absolute top-4 right-4 z-50 rounded-lg bg-red-600 px-4 py-2 text-white shadow-lg hover:bg-red-700"
          onClick={exitXR}
        >
          Exit XR
        </button>
      )}

      <Suspense fallback={<HolographicLoader />}>
        <div className="h-full w-full">{children}</div>
      </Suspense>
    </div>
  );
}

/**
 * 3D Holographic Panel
 * A floating UI panel in 3D space
 */
export interface HolographicPanelProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  title?: string;
  children?: ReactNode;
}

export function HolographicPanel({
  position = [0, 1.6, -2],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  title,
  children,
}: HolographicPanelProps) {
  return (
    <div
      className="holographic-panel"
      style={{
        transform: `translate3d(${position[0]}px, ${position[1]}px, ${position[2]}px) 
                   rotateX(${rotation[0]}rad) rotateY(${rotation[1]}rad) rotateZ(${rotation[2]}rad)
                   scale3d(${scale[0]}, ${scale[1]}, ${scale[2]})`,
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
    >
      {title && (
        <div className="panel-header bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 font-semibold text-white">
          {title}
        </div>
      )}
      <div className="panel-content rounded-lg border border-white/20 bg-black/40 p-4 backdrop-blur-lg">
        {children}
      </div>
    </div>
  );
}

/**
 * Holographic Button
 * Interactive 3D button with hover effects
 */
export interface HolographicButtonProps {
  onClick?: () => void;
  children?: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
}

export function HolographicButton({
  onClick,
  children,
  variant = "primary",
  size = "md",
}: HolographicButtonProps) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700",
    secondary: "bg-gray-600 hover:bg-gray-700",
    danger: "bg-red-600 hover:bg-red-700",
  };

  const sizes = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`holographic-button ${variants[variant]} ${sizes[size]} transform rounded-lg border border-white/20 text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:shadow-xl`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/**
 * Holographic Loader
 * 3D loading indicator
 */
export function HolographicLoader() {
  return (
    <div className="holographic-loader flex h-full w-full items-center justify-center">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 animate-ping rounded-full border-4 border-blue-500/30" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-t-blue-500 border-r-purple-500 border-b-blue-500/0 border-l-purple-500/0" />
      </div>
    </div>
  );
}

/**
 * Spatial Audio Component
 * 3D positional audio for immersive experiences
 */
export interface SpatialAudioProps {
  src: string;
  position?: [number, number, number];
  volume?: number;
  loop?: boolean;
  autoplay?: boolean;
}

export function SpatialAudio({
  src,
  position = [0, 0, 0],
  volume = 1,
  loop = false,
  autoplay = false,
}: SpatialAudioProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && "AudioContext" in window) {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(audioRef.current);
      const panner = audioContext.createPanner();

      panner.panningModel = "HRTF";
      panner.distanceModel = "inverse";
      panner.refDistance = 1;
      panner.maxDistance = 10_000;
      panner.rolloffFactor = 1;
      panner.coneInnerAngle = 360;
      panner.coneOuterAngle = 0;
      panner.coneOuterGain = 0;

      panner.positionX.setValueAtTime(position[0], audioContext.currentTime);
      panner.positionY.setValueAtTime(position[1], audioContext.currentTime);
      panner.positionZ.setValueAtTime(position[2], audioContext.currentTime);

      source.connect(panner);
      panner.connect(audioContext.destination);
    }
  }, [position]);

  return (
    <audio
      autoPlay={autoplay}
      loop={loop}
      ref={audioRef}
      src={src}
      style={{ display: "none" }}
    />
  );
}

/**
 * Hand Tracking Controller
 * Detects and tracks hand gestures in XR
 */
export interface HandTrackingProps {
  onGesture?: (gesture: string, hand: "left" | "right") => void;
  enablePinch?: boolean;
  enablePoint?: boolean;
}

export function useHandTracking({
  onGesture,
  enablePinch = true,
  enablePoint = true,
}: HandTrackingProps) {
  const [leftHand, setLeftHand] = useState<any>(null);
  const [rightHand, setRightHand] = useState<any>(null);

  useEffect(() => {
    // Hand tracking logic would go here
    // This is a placeholder for the actual WebXR hand tracking API
  }, []);

  return {
    leftHand,
    rightHand,
  };
}

/**
 * Holographic Notification
 * Floating notification in 3D space
 */
export interface HolographicNotificationProps {
  message: string;
  type?: "info" | "success" | "warning" | "error";
  duration?: number;
  position?: [number, number, number];
}

export function HolographicNotification({
  message,
  type = "info",
  duration = 3000,
  position = [0, 2, -1.5],
}: HolographicNotificationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  const typeStyles = {
    info: "bg-blue-600/90",
    success: "bg-green-600/90",
    warning: "bg-yellow-600/90",
    error: "bg-red-600/90",
  };

  return (
    <div
      className={`holographic-notification ${typeStyles[type]} animate-fade-in rounded-lg border border-white/20 px-6 py-3 text-white shadow-2xl backdrop-blur-lg`}
      style={{
        transform: `translate3d(${position[0]}px, ${position[1]}px, ${position[2]}px)`,
        transformStyle: "preserve-3d",
      }}
    >
      {message}
    </div>
  );
}

// Export all components
export default HolographicUI;
