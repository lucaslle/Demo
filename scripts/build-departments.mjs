// Génère src/features/fuel/data/departments.json : les contours des départements
// métropolitains, projetés et simplifiés en tracés SVG compacts.
//
// Source : france-geojson (contours simplifiés d'Admin Express, Licence Ouverte).
// Usage : node scripts/build-departments.mjs
import { writeFile } from "node:fs/promises";

const SOURCE_URL =
  "https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements-version-simplifiee.geojson";
const OUTPUT_PATH = new URL(
  "../src/features/fuel/data/departments.json",
  import.meta.url,
);

const VIEWBOX_WIDTH = 1000;
const SIMPLIFICATION_TOLERANCE = 0.9;
const CENTER_LATITUDE = 46.5;
const COORDINATE_DECIMALS = 1;

const isMetropolitan = (code) => /^(0[1-9]|[1-8]\d|9[0-5]|2A|2B)$/.test(code);

const response = await fetch(SOURCE_URL);
if (!response.ok) {
  throw new Error(`Téléchargement impossible : HTTP ${response.status}`);
}
const collection = await response.json();
const features = collection.features.filter(({ properties }) =>
  isMetropolitan(properties.code),
);

const polygonsOf = ({ type, coordinates }) =>
  type === "Polygon" ? [coordinates] : coordinates;

// Projection équirectangulaire corrigée de la latitude moyenne.
const longitudeScale = Math.cos((CENTER_LATITUDE * Math.PI) / 180);
const project = ([longitude, latitude]) => [
  longitude * longitudeScale,
  -latitude,
];

const allPoints = features.flatMap(({ geometry }) =>
  polygonsOf(geometry).flatMap((polygon) => polygon.flat().map(project)),
);
const minX = Math.min(...allPoints.map(([x]) => x));
const maxX = Math.max(...allPoints.map(([x]) => x));
const minY = Math.min(...allPoints.map(([, y]) => y));
const maxY = Math.max(...allPoints.map(([, y]) => y));
const scale = VIEWBOX_WIDTH / (maxX - minX);
const viewBoxHeight = Math.ceil((maxY - minY) * scale);

const toViewBox = (coordinate) => {
  const [x, y] = project(coordinate);
  return [(x - minX) * scale, (y - minY) * scale];
};

const distanceToSegment = (point, start, end) => {
  const [px, py] = point;
  const [sx, sy] = start;
  const [ex, ey] = end;
  const dx = ex - sx;
  const dy = ey - sy;
  const lengthSquared = dx * dx + dy * dy;
  const ratio =
    lengthSquared === 0
      ? 0
      : Math.max(
          0,
          Math.min(1, ((px - sx) * dx + (py - sy) * dy) / lengthSquared),
        );
  return Math.hypot(px - (sx + ratio * dx), py - (sy + ratio * dy));
};

// Douglas-Peucker : retire les points qui s'écartent peu de la ligne droite.
const simplify = (points, tolerance) => {
  if (points.length < 3) {
    return points;
  }
  let farthestIndex = 0;
  let farthestDistance = 0;
  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = distanceToSegment(
      points[index],
      points[0],
      points[points.length - 1],
    );
    if (distance > farthestDistance) {
      farthestDistance = distance;
      farthestIndex = index;
    }
  }
  if (farthestDistance <= tolerance) {
    return [points[0], points[points.length - 1]];
  }
  const left = simplify(points.slice(0, farthestIndex + 1), tolerance);
  const right = simplify(points.slice(farthestIndex), tolerance);
  return [...left.slice(0, -1), ...right];
};

const format = (value) => Number(value.toFixed(COORDINATE_DECIMALS));

const ringToPath = (ring) => {
  const points = simplify(ring.map(toViewBox), SIMPLIFICATION_TOLERANCE);
  if (points.length < 3) {
    return "";
  }
  const [first, ...rest] = points;
  return `M${format(first[0])} ${format(first[1])}${rest
    .map(([x, y]) => `L${format(x)} ${format(y)}`)
    .join("")}Z`;
};

// Centre approximatif : moyenne des sommets du plus grand polygone.
const centerOf = (geometry) => {
  const largest = polygonsOf(geometry).reduce((best, polygon) =>
    polygon[0].length > best[0].length ? polygon : best,
  );
  const ring = largest[0];
  const total = ring.reduce(
    (sum, [longitude, latitude]) => [sum[0] + longitude, sum[1] + latitude],
    [0, 0],
  );
  return [
    Number((total[1] / ring.length).toFixed(3)),
    Number((total[0] / ring.length).toFixed(3)),
  ];
};

const departments = features
  .map(({ properties, geometry }) => ({
    code: properties.code,
    name: properties.nom,
    center: centerOf(geometry),
    path: polygonsOf(geometry)
      .flatMap((polygon) => polygon.map(ringToPath))
      .join(""),
  }))
  .sort((first, second) => first.code.localeCompare(second.code));

const output = {
  viewBox: { width: VIEWBOX_WIDTH, height: viewBoxHeight },
  departments,
};
await writeFile(OUTPUT_PATH, `${JSON.stringify(output)}\n`);

const size = JSON.stringify(output).length;
console.log(
  `${departments.length} départements, viewBox ${VIEWBOX_WIDTH}x${viewBoxHeight}, ${(size / 1024).toFixed(0)} Ko`,
);
