export interface Point {
  x: number;
  y: number;
}

export type Side = "top" | "right" | "bottom" | "left";

const CORNER_RADIUS = 4;

function roundedCorner(a: Point, b: Point, c: Point, radius: number): string {
  const v1 = { x: b.x - a.x, y: b.y - a.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const len1 = Math.hypot(v1.x, v1.y) || 1;
  const len2 = Math.hypot(v2.x, v2.y) || 1;
  const r = Math.min(radius, len1 / 2, len2 / 2);
  const u1 = { x: (v1.x / len1) * r, y: (v1.y / len1) * r };
  const u2 = { x: (v2.x / len2) * r, y: (v2.y / len2) * r };
  const p1 = { x: b.x - u1.x, y: b.y - u1.y };
  const p2 = { x: b.x + u2.x, y: b.y + u2.y };
  return ` L ${p1.x} ${p1.y} Q ${b.x} ${b.y} ${p2.x} ${p2.y}`;
}

/**
 * Build an orthogonal (right-angle) path between two nodes with rounded
 * corners. Side-aware: uses the connection side of each node to pick an
 * L-shape or Z-shape route that never crosses the node bodies.
 */
export function orthogonalPath(
  source: Point,
  target: Point,
  sourceSide: Side,
  targetSide: Side,
  radius = CORNER_RADIUS
): string {
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;

  const pts: Point[] = [source];

  const horizontal = sourceSide === "left" || sourceSide === "right";
  const oppositeHorizontal = sourceSide === "left" ? targetSide === "right" : targetSide === "left";

  if (horizontal && oppositeHorizontal) {
    // Z-shape: exit horizontally, run between the two, enter horizontally.
    const gap = 28;
    const exitX = sourceSide === "right" ? source.x + gap : source.x - gap;
    const enterX = targetSide === "right" ? target.x + gap : target.x - gap;
    pts.push({ x: exitX, y: source.y });
    pts.push({ x: midX, y: source.y });
    pts.push({ x: midX, y: target.y });
    pts.push({ x: enterX, y: target.y });
    pts.push(target);
  } else if (horizontal) {
    // L-shape: exit horizontally, then straight to target side.
    const exitX = sourceSide === "right" ? source.x + 28 : source.x - 28;
    pts.push({ x: exitX, y: source.y });
    if (targetSide === "top" || targetSide === "bottom") {
      pts.push({ x: exitX, y: target.y });
    } else {
      pts.push({ x: midX, y: source.y });
      pts.push({ x: midX, y: target.y });
    }
    pts.push(target);
  } else if (sourceSide === "top" || sourceSide === "bottom") {
    const oppositeVertical = sourceSide === "top" ? targetSide === "bottom" : targetSide === "top";
    if (oppositeVertical && (targetSide === "top" || targetSide === "bottom")) {
      // Z-shape vertically.
      const gap = 28;
      const exitY = sourceSide === "top" ? source.y - gap : source.y + gap;
      const enterY = targetSide === "top" ? target.y - gap : target.y + gap;
      pts.push({ x: source.x, y: exitY });
      if (source.x === target.x) {
        // Aligned columns: detour sideways so the edge never crosses a body.
        const offset = sourceSide === "top" ? 36 : -36;
        pts.push({ x: source.x + offset, y: exitY });
        pts.push({ x: source.x + offset, y: enterY });
      } else {
        pts.push({ x: source.x, y: midY });
        pts.push({ x: target.x, y: midY });
      }
      pts.push({ x: target.x, y: enterY });
      pts.push(target);
    } else {
      // L-shape vertical-first.
      const exitY = sourceSide === "top" ? source.y - 28 : source.y + 28;
      pts.push({ x: source.x, y: exitY });
      if (targetSide === "left" || targetSide === "right") {
        pts.push({ x: target.x, y: exitY });
      } else {
        pts.push({ x: source.x, y: midY });
        pts.push({ x: target.x, y: midY });
      }
      pts.push(target);
    }
  } else {
    // Fallback straight-ish path.
    pts.push({ x: midX, y: source.y });
    pts.push({ x: midX, y: target.y });
    pts.push(target);
  }

  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i += 1) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const next = pts[i + 1];
    const straight = prev.x === cur.x && cur.x === next.x;
    const vStraight = prev.y === cur.y && cur.y === next.y;
    if (straight || vStraight) {
      d += ` L ${cur.x} ${cur.y}`;
    } else {
      d += roundedCorner(prev, cur, next, radius);
    }
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/** Midpoint of a polyline path (for label placement + waypoint grabbing). */
export function pathMidpoint(pts: Point[]): Point {
  if (pts.length === 0) return { x: 0, y: 0 };
  let total = 0;
  for (let i = 1; i < pts.length; i += 1) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  let walked = 0;
  const target = total / 2;
  for (let i = 1; i < pts.length; i += 1) {
    const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    if (walked + seg >= target) {
      const t = seg === 0 ? 0 : (target - walked) / seg;
      return {
        x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t,
        y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t,
      };
    }
    walked += seg;
  }
  return pts[pts.length - 1];
}
