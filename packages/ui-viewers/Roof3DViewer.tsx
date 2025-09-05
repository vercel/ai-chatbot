/* eslint-disable import/no-unresolved */
/* eslint-disable @next/next/no-img-element */
import React, { useEffect, useRef, useState } from 'react';

export type Roof3DViewerProps = {
  tilesUrl?: string;
  fallbackUrl?: string;
};

export const Roof3DViewer: React.FC<Roof3DViewerProps> = ({ tilesUrl, fallbackUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const roofRef = useRef<any>(null);
  const lightRef = useRef<any>(null);
  const [tilt, setTilt] = useState(30);
  const [azimuth, setAzimuth] = useState(0);
  const [hour, setHour] = useState(12);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // Dynamic imports reduce initial bundle size.
        // @ts-ignore: third-party libraries are not part of the repo.
        const THREE = await import('three');
        // @ts-ignore: runtime-only dependency
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        // @ts-ignore: runtime-only dependency
        const { TilesRenderer } = await import('3d-tiles-renderer');

        if (!containerRef.current) return;
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const scene = new THREE.Scene();

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        containerRef.current.appendChild(renderer.domElement);

        const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        camera.position.set(0, 5, 10);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;

        let roofObj: any;
        if (tilesUrl) {
          roofObj = new TilesRenderer(tilesUrl);
          roofObj.setCamera(camera);
          roofObj.setResolutionFromRenderer(camera, renderer);
          scene.add(roofObj.group);
        } else {
          const geometry = new THREE.BoxGeometry(4, 1, 4);
          const material = new THREE.MeshStandardMaterial({ color: 0x999999 });
          roofObj = new THREE.Mesh(geometry, material);
          scene.add(roofObj);
        }
        roofRef.current = roofObj;

        const light = new THREE.DirectionalLight(0xffffff, 1);
        scene.add(light);
        lightRef.current = light;

        const resize = () => {
          if (!containerRef.current) return;
          const w = containerRef.current.clientWidth;
          const h = containerRef.current.clientHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener('resize', resize);

        const tick = () => {
          if (!mounted) return;
          requestAnimationFrame(tick);
          controls.update();
          if (roofObj?.update) roofObj.update();
          renderer.render(scene, camera);
        };
        tick();

        return () => {
          mounted = false;
          window.removeEventListener('resize', resize);
          controls.dispose();
          renderer.dispose();
        };
      } catch (error) {
        setIsFallback(true);
      }
    })();
  }, [tilesUrl]);

  useEffect(() => {
    (async () => {
      try {
        // @ts-ignore runtime-only dependency
        const THREE = await import('three');
        const roof = roofRef.current;
        if (roof?.group) {
          roof.group.rotation.x = THREE.MathUtils.degToRad(tilt);
          roof.group.rotation.y = THREE.MathUtils.degToRad(azimuth);
        } else if (roof) {
          roof.rotation.x = THREE.MathUtils.degToRad(tilt);
          roof.rotation.y = THREE.MathUtils.degToRad(azimuth);
        }
        const light = lightRef.current;
        if (light) {
          const theta = (hour / 24) * Math.PI * 2;
          light.position.set(Math.sin(theta) * 10, Math.cos(theta) * 10, 0);
        }
      } catch {
        // ignore errors from dynamic imports
      }
    })();
  }, [tilt, azimuth, hour]);

  const exportPNG = async () => {
    if (!containerRef.current) return;
    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(containerRef.current);
    const link = document.createElement('a');
    link.download = 'roof-view.png';
    link.href = dataUrl;
    link.click();
  };

  if (isFallback) {
    return (
      <div className="flex flex-col items-center gap-2" aria-label="Roof 2D viewer">
        {fallbackUrl ? <img src={fallbackUrl} alt="Roof 2D" /> : <span>2D view unavailable</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div ref={containerRef} className="w-full h-64 border" aria-label="Roof 3D viewer" />
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2">
          <span className="w-16">Tilt</span>
          <input
            type="range"
            min={0}
            max={90}
            value={tilt}
            onChange={(e) => setTilt(Number(e.target.value))}
            aria-label="tilt"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-16">Azimuth</span>
          <input
            type="range"
            min={0}
            max={360}
            value={azimuth}
            onChange={(e) => setAzimuth(Number(e.target.value))}
            aria-label="azimuth"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="w-16">Hour</span>
          <input
            type="range"
            min={0}
            max={23}
            value={hour}
            onChange={(e) => setHour(Number(e.target.value))}
            aria-label="hour of day"
          />
        </label>
        <button
          type="button"
          onClick={exportPNG}
          className="px-2 py-1 border rounded self-start"
          aria-label="export screenshot"
        >
          Export PNG
        </button>
      </div>
    </div>
  );
};

export default Roof3DViewer;

