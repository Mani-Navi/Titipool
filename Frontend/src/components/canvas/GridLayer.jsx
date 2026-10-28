import React, { useMemo, memo } from "react";
import { Line, Shape, Group, Circle } from "react-konva";
import { GRID_TYPES } from "../../constants/tools";
import { getHexPoints } from "../../utils/grid";

const DOTTED_DASH_PATTERN = Object.freeze([4, 4]);

export const GridLayer = memo(({ grid, width, height }) => {
    const isEnabled = Boolean(
        grid &&
        grid.enabled &&
        grid.type !== GRID_TYPES.NONE &&
        grid.type !== "none" &&
        (grid.size || 50) > 5
    );

    const type = grid?.type || "square";
    const size = grid?.size || 50;
    const color = grid?.color || "#000000";
    const opacity = grid?.opacity ?? 0.3;
    const lineType = grid?.lineType || "solid";
    const lineWidth = grid?.lineWidth || 1;

    const dashPattern = useMemo(() => {
        if (lineType === "dotted") return DOTTED_DASH_PATTERN;
        return undefined;
    }, [lineType]);

    const dots = useMemo(() => {
        if (!isEnabled || lineType !== "dots" || (type !== "square" && type !== GRID_TYPES.SQUARE)) {
            return [];
        }
        const result = [];
        for (let x = 0; x <= width; x += size) {
            for (let y = 0; y <= height; y += size) {
                result.push({ x, y, key: `dot-${x}-${y}` });
            }
        }
        return result;
    }, [isEnabled, width, height, size, lineType, type]);

    const lines = useMemo(() => {
        if (!isEnabled || lineType === "dots" || (type !== "square" && type !== GRID_TYPES.SQUARE)) {
            return [];
        }
        const result = [];
        for (let x = 0; x <= width; x += size) {
            result.push({ points: [x, 0, x, height], key: `v-${x}` });
        }
        for (let y = 0; y <= height; y += size) {
            result.push({ points: [0, y, width, y], key: `h-${y}` });
        }
        return result;
    }, [isEnabled, width, height, size, lineType, type]);

    const isHex =
        type === "hex_h" ||
        type === "hex_v" ||
        type === GRID_TYPES.HEX_H ||
        type === GRID_TYPES.HEX_V;

    const isHorizontalHex = type === "hex_h" || type === GRID_TYPES.HEX_H;

    const hexPoints = useMemo(() => {
        if (!isEnabled || !isHex) return [];
        return getHexPoints(size / 2, isHorizontalHex);
    }, [isEnabled, isHex, size, isHorizontalHex]);

    if (!isEnabled) return null;

    // ۱. رندر گرید مربعی
    if (type === "square" || type === GRID_TYPES.SQUARE) {
        if (lineType === "dots") {
            return (
                <Group listening={false} opacity={opacity}>
                    {dots.map((d) => (
                        <Circle
                            key={d.key}
                            x={d.x}
                            y={d.y}
                            radius={lineWidth * 1.5}
                            fill={color}
                            listening={false}
                        />
                    ))}
                </Group>
            );
        }

        return (
            <Group listening={false} opacity={opacity}>
                {lines.map((line) => (
                    <Line
                        key={line.key}
                        points={line.points}
                        stroke={color}
                        strokeWidth={lineWidth}
                        dash={dashPattern}
                        listening={false}
                    />
                ))}
            </Group>
        );
    }

    // ۲. رندر گرید ایزومتریک / لوزی
    if (type === "isometric" || type === "diamond" || type === GRID_TYPES.DIMETRIC) {
        return (
            <Shape
                listening={false}
                opacity={opacity}
                stroke={color}
                strokeWidth={lineWidth}
                dash={dashPattern}
                sceneFunc={(context, shape) => {
                    context.beginPath();
                    const step = size;
                    for (let d = -height; d <= width; d += step) {
                        context.moveTo(d, 0);
                        context.lineTo(d + height, height);
                        context.moveTo(d + height, 0);
                        context.lineTo(d, height);
                    }
                    context.fillStrokeShape(shape);
                }}
            />
        );
    }

    // ۳. رندر گرید شش‌ضلعی بدون overhead فراخوانی save/translate/restore
    if (isHex) {
        const radius = size / 2;

        return (
            <Shape
                listening={false}
                opacity={opacity}
                stroke={color}
                strokeWidth={lineWidth}
                dash={dashPattern}
                sceneFunc={(context, shape) => {
                    context.beginPath();
                    const colStep = isHorizontalHex ? size * 0.75 : size * 0.866;
                    const rowStep = isHorizontalHex ? size * 0.866 : size * 0.75;

                    for (let x = radius; x < width + radius; x += colStep) {
                        const colIndex = Math.floor(x / colStep);
                        const yOffset = (colIndex % 2) * (rowStep / 2);

                        for (let y = radius + yOffset; y < height + radius; y += rowStep) {
                            context.moveTo(x + hexPoints[0], y + hexPoints[1]);
                            for (let i = 2; i < hexPoints.length; i += 2) {
                                context.lineTo(x + hexPoints[i], y + hexPoints[i + 1]);
                            }
                            context.closePath();
                        }
                    }

                    context.fillStrokeShape(shape);
                }}
            />
        );
    }

    return null;
});

GridLayer.displayName = "GridLayer";
export default GridLayer;