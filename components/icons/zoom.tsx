import * as React from 'react';
import type { SVGProps } from 'react';
const Zoom = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1em"
    height="1em"
    preserveAspectRatio="xMidYMid"
    viewBox="0 0 256 256"
    {...props}
  >
    <defs>
      <linearGradient
        id="a"
        x1="23.666%"
        x2="76.334%"
        y1="95.6118%"
        y2="4.3882%"
      >
        <stop offset=".00006%" stopColor="#0845BF" />
        <stop offset="19.11%" stopColor="#0950DE" />
        <stop offset="38.23%" stopColor="#0B59F6" />
        <stop offset="50%" stopColor="#0B5CFF" />
        <stop offset="67.32%" stopColor="#0E5EFE" />
        <stop offset="77.74%" stopColor="#1665FC" />
        <stop offset="86.33%" stopColor="#246FF9" />
        <stop offset="93.88%" stopColor="#387FF4" />
        <stop offset="100%" stopColor="#4F90EE" />
      </linearGradient>
    </defs>
    <path
      fill="url(#a)"
      d="M256 128c0 13.568-1.024 27.136-3.328 40.192-6.912 43.264-41.216 77.568-84.48 84.48C155.136 254.976 141.568 256 128 256c-13.568 0-27.136-1.024-40.192-3.328-43.264-6.912-77.568-41.216-84.48-84.48C1.024 155.136 0 141.568 0 128c0-13.568 1.024-27.136 3.328-40.192 6.912-43.264 41.216-77.568 84.48-84.48C100.864 1.024 114.432 0 128 0c13.568 0 27.136 1.024 40.192 3.328 43.264 6.912 77.568 41.216 84.48 84.48C254.976 100.864 256 114.432 256 128Z"
    />
    <path
      fill="#FFF"
      d="M204.032 207.872H75.008c-8.448 0-16.64-4.608-20.48-12.032-4.608-8.704-2.816-19.2 4.096-26.112l89.856-89.856H83.968c-17.664 0-32-14.336-32-32h118.784c8.448 0 16.64 4.608 20.48 12.032 4.608 8.704 2.816 19.2-4.096 26.112l-89.6 90.112h74.496c17.664 0 32 14.08 32 31.744Z"
    />
  </svg>
);
export default Zoom;
