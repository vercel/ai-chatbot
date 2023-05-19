export function DevGPTLogo(props: JSX.IntrinsicElements["svg"]) {
  return (
    <svg
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
        fill="white"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.1559 6.79986L12.13 5L7 14H9.02784L13.1559 6.79986ZM14.4497 9.06966L13.4236 10.8974L14.1681 12.2035H12.6904L11.6818 14H17.26L14.4497 9.06966Z"
        fill="black"
      />
    </svg>
  );
}

DevGPTLogo.displayName = "DevGPT-logo";
