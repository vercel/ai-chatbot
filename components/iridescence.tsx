'use client';

import { Color, Mesh, Program, Renderer, Triangle } from 'ogl';
import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;

  // Add a subtle offset based on the mouse position
  uv += (uMouse - vec2(0.5)) * uAmplitude;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  
  float intensity = cos(length(uv * vec2(d, a))) * 0.15 + 0.85;
  vec3 col = vec3(intensity) * uColor;
  gl_FragColor = vec4(col, 1.0);
}
`;

interface IridescenceProps {
	color?: [number, number, number];
	speed?: number;
	amplitude?: number;
	mouseReact?: boolean;
}

export default function Iridescence({
	color,
	speed = 1.0,
	amplitude = 0.1,
	mouseReact = true,
	...rest
}: IridescenceProps) {
	const { theme } = useTheme();
	const ctnDom = useRef<HTMLDivElement>(null);
	const mousePos = useRef({ x: 0.5, y: 0.5 });

	const themeColor = color || (theme === 'dark' ? [0.1, 0.1, 0.1] : [1.0, 1.0, 1.0]);

	useEffect(() => {
		if (!ctnDom.current) {
			return;
		}
		const ctn = ctnDom.current;
		const renderer = new Renderer();
		const gl = renderer.gl;

		if (!gl) {
			console.error('WebGL context not available');
			return;
		}

		gl.clearColor(1, 1, 1, 1);

		let program: Program | null = null;

		function resize() {
			const scale = 1;
			renderer.setSize(ctn.offsetWidth * scale, ctn.offsetHeight * scale);
			if (program) {
				program.uniforms.uResolution.value = new Color(
					gl.canvas.width,
					gl.canvas.height,
					gl.canvas.width / gl.canvas.height
				);
			}
		}
		window.addEventListener('resize', resize, false);
		resize();

		const geometry = new Triangle(gl);
		program = new Program(gl, {
			vertex: vertexShader,
			fragment: fragmentShader,
			uniforms: {
				uTime: { value: 0 },
				uColor: { value: new Color(...themeColor) },
				uResolution: {
					value: new Color(
						gl.canvas.width,
						gl.canvas.height,
						gl.canvas.width / gl.canvas.height
					),
				},
				uMouse: {
					value: new Float32Array([mousePos.current.x, mousePos.current.y]),
				},
				uAmplitude: { value: amplitude },
				uSpeed: { value: speed },
			},
		});

		const mesh = new Mesh(gl, { geometry, program });
		let animateId: number;

		function update(t: number) {
			animateId = requestAnimationFrame(update);
			if (program) {
				program.uniforms.uTime.value = t * 0.001;
				renderer.render({ scene: mesh });
			}
		}
		animateId = requestAnimationFrame(update);
		if (gl.canvas) {
			ctn.appendChild(gl.canvas);
		}

		function handleMouseMove(e: MouseEvent) {
			const rect = ctn.getBoundingClientRect();
			const x = (e.clientX - rect.left) / rect.width;
			const y = 1.0 - (e.clientY - rect.top) / rect.height;
			mousePos.current = { x, y };
			if (program) {
				program.uniforms.uMouse.value[0] = x;
				program.uniforms.uMouse.value[1] = y;
			}
		}
		if (mouseReact) {
			ctn.addEventListener('mousemove', handleMouseMove);
		}

		return () => {
			cancelAnimationFrame(animateId);
			window.removeEventListener('resize', resize);
			if (mouseReact) {
				ctn.removeEventListener('mousemove', handleMouseMove);
			}
			if (gl.canvas && ctn.contains(gl.canvas)) {
				ctn.removeChild(gl.canvas);
			}
			gl.getExtension('WEBGL_lose_context')?.loseContext();
		};
	}, [themeColor, speed, amplitude, mouseReact]);

	return <div className="h-full w-full" ref={ctnDom} {...rest} />;
}
