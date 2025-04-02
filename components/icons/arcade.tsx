export function ArcadeLogoSVG({
	className,
	width,
	height,
}: {
	width?: number;
	height?: number;
	className?: string;
}) {
	return (
		<svg
			width={width}
			height={height}
			viewBox="0 0 100 100"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			<title>Arcade Logo</title>
			<path
				d="M50 0C22.4 0 0 22.4 0 50C0 77.6 22.4 100 50 100C77.6 100 100 77.6 100 50C100 22.4 77.6 0 50 0ZM50 90C27.9 90 10 72.1 10 50C10 27.9 27.9 10 50 10C72.1 10 90 27.9 90 50C90 72.1 72.1 90 50 90Z"
				fill="#264849"
			/>
			<path
				d="M65 35H35C32.2 35 30 37.2 30 40V60C30 62.8 32.2 65 35 65H65C67.8 65 70 62.8 70 60V40C70 37.2 67.8 35 65 35ZM40 55C37.2 55 35 52.8 35 50C35 47.2 37.2 45 40 45C42.8 45 45 47.2 45 50C45 52.8 42.8 55 40 55ZM60 55C57.2 55 55 52.8 55 50C55 47.2 57.2 45 60 45C62.8 45 65 47.2 65 50C65 52.8 62.8 55 60 55Z"
				fill="#264849"
			/>
		</svg>
	);
}
