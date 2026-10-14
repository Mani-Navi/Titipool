import React, { useEffect, useState, useRef, memo } from "react";
import { Image as KonvaImage, Rect, Group } from "react-konva";
import { getFullAssetUrl } from "../../utils/assetUrl.js";
import { useCanvasStore } from "../../stores/canvas.store";
import { useSceneStore } from "../../stores/scene.store";

const STATIC_SHADOW_OFFSET = Object.freeze({ x: 0, y: 15 });
const MAP_CORNER_RADIUS = 24;

export const MapLayer = memo(({ mapUrl, width = 2000, height = 1500, onDimensionsChange = null }) => {
    const [image, setImage] = useState(null);
    const [dimensions, setDimensions] = useState({ width, height });
    const fitToMap = useCanvasStore((state) => state.fitToMap);
    const lastLoadedUrlRef = useRef("");

    const resolvedUrl = getFullAssetUrl(mapUrl);

    useEffect(() => {
        if (!resolvedUrl) {
            setImage(null);
            lastLoadedUrlRef.current = "";
            return;
        }

        if (lastLoadedUrlRef.current === resolvedUrl && image) {
            return;
        }

        let isMounted = true;
        const img = new window.Image();

        if (!resolvedUrl.startsWith("data:") && !resolvedUrl.startsWith("blob:")) {
            img.crossOrigin = "anonymous";
        }

        img.src = resolvedUrl;

        const applyFocus = (naturalW, naturalH) => {
            if (!isMounted) return;

            setDimensions({ width: naturalW, height: naturalH });

            useSceneStore.setState((state) => ({
                currentScene: state.currentScene
                    ? { ...state.currentScene, mapWidth: naturalW, mapHeight: naturalH }
                    : state.currentScene,
            }));

            if (onDimensionsChange) {
                onDimensionsChange(naturalW, naturalH);
            }

            fitToMap(naturalW, naturalH);
            requestAnimationFrame(() => {
                if (isMounted) {
                    fitToMap(naturalW, naturalH);
                }
            });
        };

        img.onload = () => {
            if (isMounted) {
                lastLoadedUrlRef.current = resolvedUrl;
                setImage(img);
                const naturalW = img.naturalWidth || width;
                const naturalH = img.naturalHeight || height;
                applyFocus(naturalW, naturalH);
            }
        };

        img.onerror = () => {
            const fallbackImg = new window.Image();
            fallbackImg.src = resolvedUrl;
            fallbackImg.onload = () => {
                if (isMounted) {
                    lastLoadedUrlRef.current = resolvedUrl;
                    setImage(fallbackImg);
                    const naturalW = fallbackImg.naturalWidth || width;
                    const naturalH = fallbackImg.naturalHeight || height;
                    applyFocus(naturalW, naturalH);
                }
            };
            fallbackImg.onerror = () => {
                if (import.meta.env.DEV) {
                    console.warn("[MapLayer] Failed to load map image:", resolvedUrl);
                }
            };
        };

        return () => {
            isMounted = false;
        };
    }, [resolvedUrl, width, height, fitToMap, onDimensionsChange, image]);

    if (!resolvedUrl) return null;

    return (
        <Group listening={false}>
            <Rect
                x={0}
                y={0}
                width={dimensions.width}
                height={dimensions.height}
                cornerRadius={MAP_CORNER_RADIUS}
                fill="transparent"
                stroke="rgba(245, 158, 11, 0.45)"
                strokeWidth={3}
                shadowColor="#000000"
                shadowBlur={40}
                shadowOpacity={0.9}
                shadowOffset={STATIC_SHADOW_OFFSET}
                listening={false}
            />

            {image ? (
                <KonvaImage
                    image={image}
                    x={0}
                    y={0}
                    width={dimensions.width}
                    height={dimensions.height}
                    cornerRadius={MAP_CORNER_RADIUS}
                    name="map-background"
                    listening={false}
                />
            ) : (
                <Rect
                    x={0}
                    y={0}
                    width={dimensions.width}
                    height={dimensions.height}
                    cornerRadius={MAP_CORNER_RADIUS}
                    fill="#18181b"
                    stroke="#3f3f46"
                    strokeWidth={2}
                    name="map-background"
                    listening={false}
                />
            )}
        </Group>
    );
});

MapLayer.displayName = "MapLayer";