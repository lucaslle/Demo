import { useId } from "react";

type BrandLogoProps = {
  size?: number;
};

export const BrandLogo = ({ size = 32 }: BrandLogoProps) => {
  const gradientId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="3" y1="2" x2="29" y2="30">
          <stop offset="0" stopColor="#4f46e5" />
          <stop offset="0.55" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <path
        d="M16 6.5a6.75 6.75 0 0 0-6.75 6.75c0 4.9 6.75 12.25 6.75 12.25s6.75-7.35 6.75-12.25A6.75 6.75 0 0 0 16 6.5Z"
        fill="#ffffff"
      />
      <circle cx="16" cy="13.25" r="2.6" fill="#5b4fe6" />
    </svg>
  );
};
