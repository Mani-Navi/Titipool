import { GRID_TYPES } from "../constants/tools.js";

// پیش‌محاسبه ضرایب مثلثاتی شش‌ضلعی افقی و عمودی روی دایره واحد جهت رندر فوق سریع
const UNIT_HEX_H = Object.freeze(
    Array.from({ length: 6 }).map((_, i) => {
      const angle = (Math.PI / 3) * i;
      return [Math.cos(angle), Math.sin(angle)];
    })
);

const UNIT_HEX_V = Object.freeze(
    Array.from({ length: 6 }).map((_, i) => {
      const angle = (Math.PI / 3) * i + Math.PI / 6;
      return [Math.cos(angle), Math.sin(angle)];
    })
);

export function snapToGrid(
    x,
    y,
    gridSize = 60,
    gridType = "square",
    tokenSize = 1,
    snapEnabled = true
) {
  const S = Number(gridSize) || 60;
  if (!snapEnabled || S <= 0 || gridType === GRID_TYPES.NONE || gridType === "none") {
    return { x: Math.round(x), y: Math.round(y) };
  }

  const size = Number(tokenSize) || 1;
  const type = String(gridType || "square").toLowerCase();

  // ۱. گرید مربعی (Square)
  if (type === "square" || type === GRID_TYPES.SQUARE) {
    if (size % 2 === 1) {
      const cellX = Math.floor(x / S);
      const cellY = Math.floor(y / S);
      return {
        x: cellX * S + S / 2,
        y: cellY * S + S / 2,
      };
    } else {
      const snappedX = Math.round(x / S) * S;
      const snappedY = Math.round(y / S) * S;
      return {
        x: snappedX,
        y: snappedY,
      };
    }
  }

  // ۲. گرید لوزی / ایزومتریک (Isometric / Diamond)
  if (type === "isometric" || type === "diamond" || type === GRID_TYPES.DIMETRIC) {
    const u = x - y;
    const v = x + y;
    const uCenter = Math.floor(u / S) * S + S / 2;
    const vCenter = Math.floor(v / S) * S + S / 2;
    const snappedX = Math.round((uCenter + vCenter) / 2);
    const snappedY = Math.round((vCenter - uCenter) / 2);
    return { x: snappedX, y: snappedY };
  }

  // ۳. گرید شش‌ضلعی افقی (Hex Horizontal)
  if (type === "hex_h" || type === GRID_TYPES.HEX_H) {
    const radius = S / 2;
    const colStep = S * 0.75;
    const rowStep = S * 0.866;

    const minCol = Math.max(0, Math.floor((x - radius) / colStep) - 1);
    const maxCol = minCol + 3;
    const minRow = Math.max(0, Math.floor((y - radius) / rowStep) - 1);
    const maxRow = minRow + 3;

    let bestDist = Infinity;
    let bestX = x;
    let bestY = y;

    for (let c = minCol; c <= maxCol; c++) {
      const candX = radius + c * colStep;
      const yOffset = (c % 2) * (rowStep / 2);
      for (let r = minRow; r <= maxRow; r++) {
        const candY = radius + yOffset + r * rowStep;
        const distSq = (x - candX) ** 2 + (y - candY) ** 2;
        if (distSq < bestDist) {
          bestDist = distSq;
          bestX = candX;
          bestY = candY;
        }
      }
    }
    return { x: Math.round(bestX), y: Math.round(bestY) };
  }

  // ۴. گرید شش‌ضلعی عمودی (Hex Vertical)
  if (type === "hex_v" || type === GRID_TYPES.HEX_V) {
    const radius = S / 2;
    const colStep = S * 0.866;
    const rowStep = S * 0.75;

    const minCol = Math.max(0, Math.floor((x - radius) / colStep) - 1);
    const maxCol = minCol + 3;
    const minRow = Math.max(0, Math.floor((y - radius) / rowStep) - 1);
    const maxRow = minRow + 3;

    let bestDist = Infinity;
    let bestX = x;
    let bestY = y;

    for (let c = minCol; c <= maxCol; c++) {
      const candX = radius + c * colStep;
      const yOffset = (c % 2) * (rowStep / 2);
      for (let r = minRow; r <= maxRow; r++) {
        const candY = radius + yOffset + r * rowStep;
        const distSq = (x - candX) ** 2 + (y - candY) ** 2;
        if (distSq < bestDist) {
          bestDist = distSq;
          bestX = candX;
          bestY = candY;
        }
      }
    }
    return { x: Math.round(bestX), y: Math.round(bestY) };
  }

  return { x: Math.round(x), y: Math.round(y) };
}

export function getHexPoints(radius, isHorizontal = true) {
  const points = [];
  const unitPoints = isHorizontal ? UNIT_HEX_H : UNIT_HEX_V;

  for (let i = 0; i < 6; i++) {
    points.push(radius * unitPoints[i][0]);
    points.push(radius * unitPoints[i][1]);
  }

  return points;
}