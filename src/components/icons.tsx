import type { SVGProps } from "react";

const paths = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  sparkle: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z",
  person: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0",
  sofa: "M4 11V8a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v3M2 13a2 2 0 0 1 4 0v2h12v-2a2 2 0 0 1 4 0v5H2zm2 5v2m16-2v2",
  water: "M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z",
  office: "M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16m0-11h4a1 1 0 0 1 1 1v10M3 21h18M8 8h3m-3 4h3m-3 4h3",
  hotel: "M3 20V6m0 8h18v6M3 10h7a3 3 0 0 1 3 3v1m8 0v-2a3 3 0 0 0-3-3h-5",
  check: "M5 12.5l4.5 4.5L19 7.5",
  phone: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  mail: "M3 6h18v12H3zm0 0 9 7 9-7",
  chat: "M4 20l1.3-3.9A8 8 0 1 1 8 19.3z",
  clock: "M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  pin: "M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  leaf: "M5 19C5 10 11 5 20 4c0 9-5 15-14 15zm0 0 7-7",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  calendar: "M4 6h16v14H4zm0 4h16M8 3v4m8-4v4",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  chart: "M4 20V10m6 10V4m6 16v-7m4 7H2",
  users: "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 10a7 7 0 0 1 14 0m1-10a3 3 0 1 0 0-6m2 16h3a6 6 0 0 0-4-5.6",
  briefcase: "M3 8h18v12H3zm6 0V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M3 13h18",
  logout: "M15 4h4v16h-4M10 8l-4 4 4 4m-4-4h11",
  board: "M4 4h16v16H4zm0 5h16M9 9v11m5-11v11",
  badge: "M4 5h16v14H4zm5 4.5a2 2 0 1 0 0 .01M6 16a3 3 0 0 1 6 0m3-6h3m-3 3h3",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width={24}
      height={24}
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
