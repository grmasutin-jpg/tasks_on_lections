import type { ReactNode, SVGProps } from 'react';

export type IconName =
  | 'play'
  | 'target'
  | 'repeat'
  | 'brain'
  | 'book'
  | 'dumbbell'
  | 'scale'
  | 'stethoscope'
  | 'graph'
  | 'sparkles'
  | 'zap'
  | 'heart'
  | 'trophy'
  | 'check'
  | 'x'
  | 'lightbulb'
  | 'arrowRight'
  | 'arrowLeft'
  | 'rotate'
  | 'clock'
  | 'flag'
  | 'route'
  | 'layers'
  | 'alert'
  | 'key'
  | 'user'
  | 'chart';

const PATHS: Record<IconName, ReactNode> = {
  play: <path d="M8 5.2v13.6L19 12 8 5.2Z" />,
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </>
  ),
  repeat: (
    <>
      <path d="M4 9a8 8 0 0 1 13.5-4.6L20 7" />
      <path d="M20 15a8 8 0 0 1-13.5 4.6L4 17" />
      <path d="M20 3v4h-4M4 21v-4h4" />
    </>
  ),
  brain: (
    <>
      <path d="M9.5 4a2.5 2.5 0 0 0-2.4 3.2A2.6 2.6 0 0 0 5 9.6 2.6 2.6 0 0 0 6 14a2.6 2.6 0 0 0 2.6 2.6A2.5 2.5 0 0 0 12 20V5.6A2.4 2.4 0 0 0 9.5 4Z" />
      <path d="M14.5 4a2.5 2.5 0 0 1 2.4 3.2A2.6 2.6 0 0 1 19 9.6 2.6 2.6 0 0 1 18 14a2.6 2.6 0 0 1-2.6 2.6A2.5 2.5 0 0 1 12 20" />
    </>
  ),
  book: (
    <>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v14H6.5A2.5 2.5 0 0 0 4 19.5v-14Z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H19v4H6.5A2.5 2.5 0 0 1 4 19.5Z" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12" />
    </>
  ),
  scale: (
    <>
      <path d="M12 4v16M7 20h10M12 6l-6 2M12 6l6 2" />
      <path d="M3 16a3 3 0 0 0 6 0L6 8 3 16ZM15 16a3 3 0 0 0 6 0l-3-8-3 8Z" />
    </>
  ),
  stethoscope: (
    <>
      <path d="M6 3v5a4 4 0 0 0 8 0V3" />
      <path d="M10 12v2a5 5 0 0 0 10 0v-1" />
      <circle cx="20" cy="10" r="2" />
    </>
  ),
  graph: (
    <>
      <path d="M4 4v16h16" />
      <path d="M7 15.5 11 9l3 3.6L20 5" />
    </>
  ),
  sparkles: (
    <>
      <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
      <path d="m18.5 15.5.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </>
  ),
  zap: <path d="M13 3 5 13.5h6L11 21l8-10.5h-6L13 3Z" />,
  heart: (
    <path d="M12 20s-7-4.3-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.7 12 20 12 20Z" />
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5A3.5 3.5 0 0 1 16.5 11" />
      <path d="M12 14v3M8.5 20h7" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  lightbulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 1 3.5 10.9c-.6.5-.9 1-.9 1.6H9.4c0-.6-.3-1.1-.9-1.6A6 6 0 0 1 12 3Z" />
    </>
  ),
  arrowRight: <path d="M4 12h15m-6-7 7 7-7 7" />,
  arrowLeft: <path d="M20 12H5m6-7-7 7 7 7" />,
  rotate: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
      <path d="M3 4v5h5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  flag: <path d="M5 21V4h11l-2 4 2 4H5" />,
  route: (
    <>
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <path d="M8.5 18H14a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h5.5" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5M3 17l9 5 9-5" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4 2.8 20h18.4L12 4Z" />
      <path d="M12 10v4M12 17.2v.2" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="12" r="4" />
      <path d="M12 12h9m-3 0v3m-3-3v2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
};

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

export function Icon({ name, className = 'h-5 w-5', ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
