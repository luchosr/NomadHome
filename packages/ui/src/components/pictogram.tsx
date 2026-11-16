import type { SVGProps } from "react";

type SvgBase = Omit<SVGProps<SVGSVGElement>, "name" | "children">;

type Labelled = {
  /** Accessible name. Omit to render the glyph as decorative (aria-hidden). */
  label?: string;
};

function a11y(label: string | undefined) {
  return label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };
}

// All glyphs are drawn on one 32 x 32 grid: 3-unit strokes, square caps, mitred joins,
// solid masses filled with currentColor.
const common = {
  viewBox: "0 0 32 32",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3,
  strokeLinecap: "square",
  strokeLinejoin: "miter",
  width: "1em",
  height: "1em",
  focusable: "false",
} as const;

export type PictogramProps = SvgBase &
  Labelled & {
    name: "bed" | "desk";
  };

/** Wayfinding pictogram. Inherits text colour; size with font-size or width/height classes. */
export function Pictogram({ name, label, ...props }: PictogramProps) {
  return (
    <svg {...common} {...a11y(label)} {...props}>
      {name === "bed" ? (
        <>
          {/* headboard post and floor line with end leg */}
          <path d="M4 5v22" />
          <path d="M4 22h24v5" />
          {/* mattress mass and pillow */}
          <rect x="4" y="15" width="24" height="7" fill="currentColor" stroke="none" />
          <rect x="7" y="10" width="8" height="5" fill="currentColor" stroke="none" />
        </>
      ) : (
        <>
          {/* desktop slab and two legs */}
          <rect x="3" y="17" width="26" height="4" fill="currentColor" stroke="none" />
          <path d="M6 21v7M26 21v7" />
          {/* screen on a stand */}
          <rect x="9.5" y="4.5" width="13" height="8" />
          <path d="M16 12.5V17" />
        </>
      )}
    </svg>
  );
}

export type ArrowProps = SvgBase & Labelled;

/** Solid right-pointing wayfinding arrow. Inherits text colour. */
export function Arrow({ label, ...props }: ArrowProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="currentColor"
      width="1em"
      height="1em"
      focusable="false"
      {...a11y(label)}
      {...props}
    >
      <path d="M3 12h14V4l13 12-13 12v-8H3z" />
    </svg>
  );
}
