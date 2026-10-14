import React, { useRef, useEffect, useCallback, memo } from "react";
import { Line, Rect, Circle, RegularPolygon, Text, Group, Transformer } from "react-konva";
import { useSceneStore } from "../../stores/scene.store";
import { useCanvasStore } from "../../stores/canvas.store";
import { wsService } from "../../services/websocket.service";
import { DRAW_MODES } from "../../constants/tools";
import { WS_EVENTS } from "../../constants/wsEvents.js";

const TRANSFORMER_BORDER_DASH = Object.freeze([4, 4]);
const EMPTY_DRAWINGS = Object.freeze([]);

const transformerBoundBox = (oldBox, newBox) => {
    if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
        return oldBox;
    }
    return newBox;
};

const SingleDrawingShape = memo(
    ({
         draw,
         isLive = false,
         isEraser = false,
         isSelectMode = false,
         isSelected = false,
         canModify = false,
         onSelect = null,
         onErase = null,
         onUpdate = null,
         onDblClick = null,
         isGM = false,
     }) => {
        const shapeRef = useRef(null);
        const trRef = useRef(null);

        useEffect(() => {
            if (isSelected && trRef.current && shapeRef.current) {
                trRef.current.nodes([shapeRef.current]);
                trRef.current.getLayer()?.batchDraw();
            }
        }, [isSelected]);

        const drawId = String(draw?.clientDrawingId || draw?.id || draw?.drawingId || "");

        const handleEraseAction = useCallback(
            (e) => {
                if (e && e.cancelBubble !== undefined) e.cancelBubble = true;
                if (isEraser && onErase) {
                    onErase(drawId);
                }
            },
            [isEraser, onErase, drawId]
        );

        const handleClick = useCallback(
            (e) => {
                if (e && e.cancelBubble !== undefined) e.cancelBubble = true;
                if (isEraser && canModify) {
                    handleEraseAction(e);
                } else if (isSelectMode && canModify && onSelect) {
                    onSelect(drawId);
                }
            },
            [isEraser, canModify, handleEraseAction, isSelectMode, onSelect, drawId]
        );

        const handleDoubleClick = useCallback(
            (e) => {
                if (e && e.cancelBubble !== undefined) e.cancelBubble = true;
                if (onDblClick && canModify) {
                    onDblClick(draw);
                }
            },
            [onDblClick, canModify, draw]
        );

        const handleDragEnd = useCallback(
            (e) => {
                if (e && e.cancelBubble !== undefined) e.cancelBubble = true;
                const node = shapeRef.current;
                if (!node || !onUpdate || !canModify) return;

                onUpdate(drawId, {
                    x: Math.round(node.x()),
                    y: Math.round(node.y()),
                    scaleX: node.scaleX(),
                    scaleY: node.scaleY(),
                    rotation: Math.round(node.rotation()),
                });
            },
            [onUpdate, canModify, drawId]
        );

        const handleTransformEnd = useCallback(
            (e) => {
                if (e && e.cancelBubble !== undefined) e.cancelBubble = true;
                const node = shapeRef.current;
                if (!node || !onUpdate || !canModify) return;

                onUpdate(drawId, {
                    x: Math.round(node.x()),
                    y: Math.round(node.y()),
                    scaleX: Number(node.scaleX().toFixed(3)),
                    scaleY: Number(node.scaleY().toFixed(3)),
                    rotation: Math.round(node.rotation()),
                });
            },
            [onUpdate, canModify, drawId]
        );

        if (!draw) return null;
        if (draw.isGMLayer && !isGM) return null;

        const opacity = isLive ? 0.75 : draw.isGMLayer ? 0.65 : 1;
        const type = String(draw.type || draw.tool || "marker").toLowerCase();
        const stroke = draw.stroke || draw.color || "#f59e0b";
        const strokeWidth =
            draw.strokeWidth !== undefined
                ? Number(draw.strokeWidth)
                : draw.stroke_width !== undefined
                    ? Number(draw.stroke_width)
                    : draw.lineWidth || 4;

        const scaleX = draw.scaleX !== undefined && draw.scaleX !== null ? Number(draw.scaleX) : 1;
        const scaleY = draw.scaleY !== undefined && draw.scaleY !== null ? Number(draw.scaleY) : 1;
        const rotation = draw.rotation !== undefined && draw.rotation !== null ? Number(draw.rotation) : 0;

        let safePoints = [];
        if (Array.isArray(draw.points)) {
            safePoints = draw.points;
        } else if (typeof draw.points === "string") {
            try {
                safePoints = JSON.parse(draw.points);
            } catch {
                safePoints = [];
            }
        }

        const isInteractive = (isEraser || isSelectMode) && canModify && !isLive;

        const commonProps = {
            ref: shapeRef,
            x: draw.x || 0,
            y: draw.y || 0,
            scaleX: scaleX,
            scaleY: scaleY,
            rotation: rotation,
            draggable: isSelectMode && canModify && !isLive,
            listening: isInteractive,
            onClick: handleClick,
            onTap: handleClick,
            onDblClick: handleDoubleClick,
            onDblTap: handleDoubleClick,
            onMouseDown: (e) => {
                if (isEraser && canModify) handleEraseAction(e);
            },
            onMouseEnter: (e) => {
                if (isEraser && canModify && e.evt && (e.evt.buttons === 1 || e.evt.which === 1)) {
                    handleEraseAction(e);
                }
            },
            onDragEnd: handleDragEnd,
            onTransformEnd: handleTransformEnd,
            hitStrokeWidth: Math.max(strokeWidth + 14, 24),
        };

        let renderedElement = null;

        switch (type) {
            case DRAW_MODES.MARKER:
            case "marker":
            case "freehand":
                renderedElement = (
                    <Line
                        points={safePoints}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        tension={0.4}
                        lineCap="round"
                        lineJoin="round"
                        opacity={opacity}
                        {...commonProps}
                    />
                );
                break;

            case DRAW_MODES.BRUSH:
            case "brush":
                renderedElement = (
                    <Line
                        points={safePoints}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        fill={draw.fill || `${stroke}33`}
                        closed={true}
                        tension={0.3}
                        lineCap="round"
                        lineJoin="round"
                        opacity={opacity}
                        {...commonProps}
                    />
                );
                break;

            case DRAW_MODES.LINE:
            case "line":
                renderedElement = (
                    <Line
                        points={safePoints}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        lineCap="round"
                        lineJoin="round"
                        opacity={opacity}
                        {...commonProps}
                    />
                );
                break;

            case DRAW_MODES.POLYGON:
            case "polygon":
                renderedElement = (
                    <Line
                        points={safePoints}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        fill={draw.fill || "transparent"}
                        closed={!isLive}
                        tension={0.1}
                        lineCap="round"
                        lineJoin="round"
                        opacity={opacity}
                        {...commonProps}
                    />
                );
                break;

            case DRAW_MODES.RECTANGLE:
            case "rectangle":
            case "rect":
                renderedElement = (
                    <Rect
                        width={draw.width || 60}
                        height={draw.height || 60}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        fill={draw.fill || "transparent"}
                        cornerRadius={4}
                        opacity={opacity}
                        {...commonProps}
                    />
                );
                break;

            case DRAW_MODES.CIRCLE:
            case "circle":
                renderedElement = (
                    <Circle
                        radius={draw.radius || 40}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        fill={draw.fill || "transparent"}
                        opacity={opacity}
                        {...commonProps}
                    />
                );
                break;

            case DRAW_MODES.TRIANGLE:
            case "triangle":
                renderedElement = (
                    <RegularPolygon
                        sides={3}
                        radius={draw.radius || 40}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        fill={draw.fill || "transparent"}
                        opacity={opacity}
                        {...commonProps}
                    />
                );
                break;

            case DRAW_MODES.HEXAGON:
            case "hexagon":
                renderedElement = (
                    <RegularPolygon
                        sides={6}
                        radius={draw.radius || 45}
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        fill={draw.fill || "transparent"}
                        opacity={opacity}
                        {...commonProps}
                    />
                );
                break;

            case "text": {
                const resolvedFontFamily = draw.fontFamily || draw.font_family || "Vazirmatn";
                const resolvedFontSize = Number(draw.fontSize || draw.font_size || 24);
                const resolvedFill = draw.fill || draw.color || draw.textColor || stroke || "#f59e0b";

                let rawFontStyle = String(draw.fontStyle || draw.font_style || "").toLowerCase().trim();
                if (!rawFontStyle) {
                    const isB = Boolean(draw.isBold || draw.is_bold || draw.bold);
                    const isI = Boolean(draw.isItalic || draw.is_italic || draw.italic);
                    if (isB && isI) rawFontStyle = "italic bold";
                    else if (isB) rawFontStyle = "bold";
                    else if (isI) rawFontStyle = "italic";
                    else rawFontStyle = "normal";
                }

                const textStroke =
                    (draw.stroke || draw.strokeColor || draw.textStrokeColor) && strokeWidth > 0
                        ? draw.stroke || draw.strokeColor || draw.textStrokeColor
                        : undefined;
                const textStrokeW = textStroke ? strokeWidth : 0;

                renderedElement = (
                    <Text
                        text={draw.text || ""}
                        fontSize={resolvedFontSize}
                        fontFamily={resolvedFontFamily}
                        fontStyle={rawFontStyle}
                        fill={resolvedFill}
                        stroke={textStroke}
                        strokeWidth={textStrokeW}
                        lineHeight={1.0}
                        opacity={opacity}
                        {...commonProps}
                    />
                );
                break;
            }

            default:
                return null;
        }

        const isKeepRatio =
            type === DRAW_MODES.CIRCLE ||
            type === "circle" ||
            type === DRAW_MODES.TRIANGLE ||
            type === DRAW_MODES.HEXAGON ||
            type === "text";

        return (
            <Group>
                {renderedElement}
                {isSelected && isSelectMode && canModify && (
                    <Transformer
                        ref={trRef}
                        rotateEnabled={true}
                        keepRatio={isKeepRatio}
                        boundBoxFunc={transformerBoundBox}
                        anchorFill="#f59e0b"
                        anchorStroke="#090a0f"
                        anchorCornerRadius={3}
                        anchorSize={8}
                        borderStroke="#f59e0b"
                        borderDash={TRANSFORMER_BORDER_DASH}
                    />
                )}
            </Group>
        );
    }
);

SingleDrawingShape.displayName = "SingleDrawingShape";

export const DrawingLayer = memo(
    ({
         liveDrawing = null,
         isEraser = false,
         isSelectMode = false,
         isGM = false,
         permissions = {},
         onErase = null,
         onDblClickText = null,
     }) => {
        const drawings = useSceneStore((state) => state.currentScene?.drawings) || EMPTY_DRAWINGS;
        const currentSceneId = useSceneStore((state) => state.currentScene?.id);
        const remoteLiveDrawing = useSceneStore((state) => state.remoteLiveDrawing);
        const updateDrawing = useSceneStore((state) => state.updateDrawing);

        const selectedDrawingId = useCanvasStore((state) => state.selectedDrawingId);
        const setSelectedDrawingId = useCanvasStore((state) => state.setSelectedDrawingId);

        const canModifyDrawings = Boolean(
            isGM || permissions?.canDrawing === true || permissions?.canText === true
        );

        const handleUpdateDrawing = useCallback(
            (drawId, updates) => {
                if (!canModifyDrawings) return;

                updateDrawing(drawId, updates);
                const existing = drawings.find(
                    (d) => String(d.clientDrawingId || d.id || d.drawingId) === String(drawId)
                );
                if (existing) {
                    const fullUpdated = {
                        ...existing,
                        ...updates,
                        id: drawId,
                        clientDrawingId: drawId,
                        sceneId: currentSceneId,
                    };
                    wsService.send(WS_EVENTS.DRAWING_ADDED || "DRAWING_ADD", fullUpdated);
                }
            },
            [canModifyDrawings, updateDrawing, drawings, currentSceneId]
        );

        const handleShapeDblClick = useCallback(
            (shape) => {
                if (String(shape.type).toLowerCase() === "text" && onDblClickText) {
                    onDblClickText(shape);
                }
            },
            [onDblClickText]
        );

        return (
            <Group id="drawing-group-layer">
                {drawings.map((draw) => {
                    const drawId = String(draw.clientDrawingId || draw.id || draw.drawingId);
                    return (
                        <SingleDrawingShape
                            key={drawId}
                            draw={draw}
                            isLive={false}
                            isEraser={isEraser}
                            isSelectMode={isSelectMode}
                            isSelected={selectedDrawingId === drawId}
                            canModify={canModifyDrawings}
                            onSelect={setSelectedDrawingId}
                            onErase={onErase}
                            onUpdate={handleUpdateDrawing}
                            onDblClick={handleShapeDblClick}
                            isGM={isGM}
                        />
                    );
                })}

                {liveDrawing && (
                    <SingleDrawingShape draw={liveDrawing} isLive={true} canModify={false} isGM={isGM} />
                )}

                {remoteLiveDrawing && (
                    <SingleDrawingShape draw={remoteLiveDrawing} isLive={true} canModify={false} isGM={isGM} />
                )}
            </Group>
        );
    }
);

DrawingLayer.displayName = "DrawingLayer";