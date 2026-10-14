import React, { useEffect, useRef, memo } from "react";
import { Group, Circle, Text, Rect } from "react-konva";
import { useSceneStore } from "../../stores/scene.store";
import { useCanvasStore } from "../../stores/canvas.store";
import { useAuthStore } from "../../stores/auth.store";
import { TOOLS } from "../../constants/tools";

const LASER_DASH_PATTERN = Object.freeze([4, 4]);
const EMPTY_PINGS = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze({});

function renderLaserDot(x, y, name = "", color = "#ef4444", isLocal = false) {
    const key = isLocal ? "local-laser" : `laser-${name}-${x}-${y}`;
    const tagWidth = Math.max(name.length * 8 + 20, 48);
    const tagOffset = -Math.max(name.length * 4 + 10, 24);

    return (
        <Group key={key} x={x} y={y} listening={false}>
            <Circle
                radius={16}
                fill="rgba(239, 68, 68, 0.2)"
                stroke={color}
                strokeWidth={1.5}
                listening={false}
            />
            <Circle
                radius={6}
                fill={color}
                shadowColor={color}
                shadowBlur={15}
                shadowOpacity={1}
                listening={false}
            />
            <Circle radius={2.5} fill="#ffffff" listening={false} />

            {name && (
                <Group y={-24} listening={false}>
                    <Rect
                        x={tagOffset}
                        y={0}
                        width={tagWidth}
                        height={16}
                        fill="rgba(9, 10, 15, 0.9)"
                        cornerRadius={4}
                        stroke={color}
                        strokeWidth={1}
                        listening={false}
                    />
                    <Text
                        text={name}
                        x={tagOffset}
                        y={2}
                        width={tagWidth}
                        align="center"
                        fontSize={10}
                        fontStyle="bold"
                        fontFamily="Vazirmatn"
                        fill="#fecaca"
                        listening={false}
                    />
                </Group>
            )}
        </Group>
    );
}

export const PingLayer = memo(() => {
    const pings = useSceneStore((state) => state.pings) || EMPTY_PINGS;
    const activeTool = useCanvasStore((state) => state.activeTool);
    const laserPosition = useCanvasStore((state) => state.laserPosition);
    const remoteLasers = useCanvasStore((state) => state.remoteLasers) || EMPTY_OBJECT;
    const clearRemoteLaser = useCanvasStore((state) => state.clearRemoteLaser);

    const currentUser = useAuthStore((state) => state.user);
    const currentUserId = String(currentUser?.id || currentUser?.userId || "");

    const isLocalLaserActive = activeTool === TOOLS.LASER && Boolean(laserPosition);

    const remoteLasersRef = useRef(remoteLasers);
    useEffect(() => {
        remoteLasersRef.current = remoteLasers;
    }, [remoteLasers]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            const currentRemote = remoteLasersRef.current;
            Object.values(currentRemote).forEach((laser) => {
                if (now - (laser.timestamp || 0) > 3000) {
                    clearRemoteLaser(laser.userId);
                }
            });
        }, 1500);

        return () => clearInterval(interval);
    }, [clearRemoteLaser]);

    return (
        <Group listening={false}>
            {pings.map((ping) => {
                const userCol = ping.userColor || "#f59e0b";
                return (
                    <Group key={ping.id} x={ping.x} y={ping.y} listening={false}>
                        <Circle
                            radius={25}
                            stroke={userCol}
                            strokeWidth={3}
                            opacity={0.8}
                            listening={false}
                        />
                        <Circle
                            radius={45}
                            stroke={userCol}
                            strokeWidth={2}
                            opacity={0.4}
                            dash={LASER_DASH_PATTERN}
                            listening={false}
                        />
                        <Circle
                            radius={8}
                            fill={userCol}
                            shadowColor={userCol}
                            shadowBlur={12}
                            listening={false}
                        />
                        <Text
                            text={ping.userName || "بازیکن"}
                            x={-50}
                            y={12}
                            width={100}
                            align="center"
                            fontSize={11}
                            fontStyle="bold"
                            fontFamily="Vazirmatn"
                            fill="#ffffff"
                            shadowColor="#000000"
                            shadowBlur={4}
                            listening={false}
                        />
                    </Group>
                );
            })}

            {isLocalLaserActive &&
                renderLaserDot(laserPosition.x, laserPosition.y, currentUser?.username || "شما", "#ef4444", true)}

            {Object.values(remoteLasers).map((laser) => {
                if (String(laser.userId) === currentUserId) return null;
                return renderLaserDot(laser.x, laser.y, laser.userName || "بازیکن", laser.color || "#ef4444", false);
            })}
        </Group>
    );
});

PingLayer.displayName = "PingLayer";