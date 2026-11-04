type BrandLogoProps = {
  size?: number;
};

export const BrandLogo = ({ size = 32 }: BrandLogoProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    aria-hidden="true"
    focusable="false"
  >
    <rect width="32" height="32" rx="9" fill="#c8f545" />
    <path
      d="M16 6.5a6.75 6.75 0 0 0-6.75 6.75c0 4.9 6.75 12.25 6.75 12.25s6.75-7.35 6.75-12.25A6.75 6.75 0 0 0 16 6.5Z"
      fill="#0a0d06"
    />
    <circle cx="16" cy="13.25" r="2.6" fill="#c8f545" />
  </svg>
);
