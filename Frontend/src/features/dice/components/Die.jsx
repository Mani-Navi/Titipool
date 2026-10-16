import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody } from '@react-three/rapier';
import * as THREE from 'three';
import { DICE_CONFIGS } from '../engine/diceDefinitions';
import { createMaterialsForType } from '../engine/textureGenerator';
import { useDiceStore } from '../state/dice.store';
import { diceAudio } from '../engine/diceAudio';

const UP_VECTOR = new THREE.Vector3(0, 1, 0);
const DOWN_VECTOR = new THREE.Vector3(0, -1, 0);
const VELOCITY_THRESHOLD = 0.08;
const ANGULAR_THRESHOLD = 0.12;
const REQUIRED_STABLE_FRAMES = 25;

const DRAG_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), -2.6);

export function Die({
                        id,
                        type,
                        theme = 'amethyst',
                        initialPos,
                        initialRotation,
                        initialLinearVelocity,
                        initialAngularVelocity,
                    }) {
    const rigidBodyRef = useRef(null);
    const { viewport } = useThree();
    const config = DICE_CONFIGS[type] || DICE_CONFIGS.d6;
    const setDieResult = useDiceStore((s) => s.setDieResult);
    const isRemoteRoll = useDiceStore((s) => s.isRemoteRoll);
    const broadcastReThrow = useDiceStore((s) => s.broadcastReThrow);
    const remoteReThrow = useDiceStore((s) => s.remoteReThrow);
    const settledTransforms = useDiceStore((s) => s.settledTransforms);

    const stableFrameCounter = useRef(0);
    const isSettledRef = useRef(false);
    const spawnTimeRef = useRef(Date.now());

    const isDraggingRef = useRef(false);
    const dragHistoryRef = useRef([]);

    const safeLimitX = Math.max((viewport.width / 2) - 1.2, 1.8);
    const safeLimitZ = Math.max((viewport.height / 2) - 1.2, 1.8);

    useEffect(() => {
        if (!isRemoteRoll || !settledTransforms?.[id] || !rigidBodyRef.current) return;

        const target = settledTransforms[id];
        rigidBodyRef.current.setTranslation(target.position, true);
        rigidBodyRef.current.setRotation(target.rotation, true);
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        isSettledRef.current = true;
    }, [settledTransforms, id, isRemoteRoll]);

    useEffect(() => {
        if (!remoteReThrow || remoteReThrow.dieId !== id || !rigidBodyRef.current) return;

        rigidBodyRef.current.setTranslation(remoteReThrow.translation, true);
        rigidBodyRef.current.setLinvel(remoteReThrow.velocity, true);
        rigidBodyRef.current.setAngvel(remoteReThrow.angularVelocity, true);

        diceAudio.playThrow(1);
        spawnTimeRef.current = Date.now();
        stableFrameCounter.current = 0;
        isSettledRef.current = false;
    }, [remoteReThrow, id]);

    const { geometry, materials } = useMemo(() => {
        const geom = config.createGeometry();
        const faceValues = config.faces.map((f) => f.value);

        if (type === 'd2') {
            const mats = createMaterialsForType('d2', [1, 2], theme);
            return { geometry: geom, materials: mats };
        }

        if (type === 'd6' || type === 'forge') {
            const d6Order = type === 'forge' ? [2, -2, 1, 1, -1, 0] : [3, 4, 6, 1, 5, 2];
            const mats = createMaterialsForType(type, d6Order, theme);
            return { geometry: geom, materials: mats };
        }

        const faceCount = config.faces.length;
        geom.clearGroups();

        const trianglesPerFace =
            type === 'd10' || type === 'd100' || type === 'd1000' ? 2 : type === 'd12' ? 3 : 1;

        for (let i = 0; i < faceCount; i++) {
            geom.addGroup(i * trianglesPerFace * 3, trianglesPerFace * 3, i);
        }

        if (!geom.attributes.uv) {
            const uvs = [];
            for (let i = 0; i < faceCount; i++) {
                for (let t = 0; t < trianglesPerFace; t++) {
                    uvs.push(0.5, 0.95, 0.05, 0.05, 0.95, 0.05);
                }
            }
            geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        }

        geom.computeVertexNormals();

        const mats = createMaterialsForType(type, faceValues, theme);
        return { geometry: geom, materials: mats };
    }, [type, config, theme]);

    useEffect(() => {
        return () => {
            geometry.dispose();
            if (Array.isArray(materials)) {
                materials.forEach((mat) => {
                    mat.dispose();
                });
            }
        };
    }, [geometry, materials]);

    const handleCollision = () => {
        if (!rigidBodyRef.current || isDraggingRef.current) return;
        const linvel = rigidBodyRef.current.linvel();
        const speed = Math.hypot(linvel.x, linvel.y, linvel.z);

        if (speed > 0.8) {
            const intensity = Math.min(speed / 16, 1.0);
            diceAudio.playImpact(intensity);
        }
    };

    const calculateTopValue = () => {
        if (!rigidBodyRef.current || isSettledRef.current || isDraggingRef.current) return;
        const rotation = rigidBodyRef.current.rotation();
        const quat = new THREE.Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);

        const targetVector = type === 'd4' ? DOWN_VECTOR : UP_VECTOR;

        let maxDot = -Infinity;
        let winningFace = null;

        for (const face of config.faces) {
            const worldNormal = face.normal.clone().applyQuaternion(quat);
            const dot = worldNormal.dot(targetVector);

            if (dot > maxDot) {
                maxDot = dot;
                winningFace = face;
            }
        }

        if (maxDot < 0.6) {
            rigidBodyRef.current.applyImpulse({ x: 0.15, y: 0.6, z: 0.15 }, true);
            rigidBodyRef.current.applyTorqueImpulse({ x: 0.3, y: 0.3, z: 0.3 }, true);
            stableFrameCounter.current = 0;
            return;
        }

        isSettledRef.current = true;

        if (!isRemoteRoll) {
            const pos = rigidBodyRef.current.translation();
            const rot = rigidBodyRef.current.rotation();
            setDieResult(id, winningFace.value, {
                position: { x: pos.x, y: pos.y, z: pos.z },
                rotation: { x: rot.x, y: rot.y, z: rot.z, w: rot.w },
            });
        }
    };

    useFrame(() => {
        if (isDraggingRef.current || isSettledRef.current || !rigidBodyRef.current) return;

        if (Date.now() - spawnTimeRef.current < 900) return;

        const linvel = rigidBodyRef.current.linvel();
        const angvel = rigidBodyRef.current.angvel();

        const speed = Math.hypot(linvel.x, linvel.y, linvel.z);
        const rotSpeed = Math.hypot(angvel.x, angvel.y, angvel.z);

        if (speed < VELOCITY_THRESHOLD && rotSpeed < ANGULAR_THRESHOLD) {
            stableFrameCounter.current += 1;
            if (stableFrameCounter.current >= REQUIRED_STABLE_FRAMES) {
                calculateTopValue();
            }
        } else {
            stableFrameCounter.current = 0;
        }

        if (Date.now() - spawnTimeRef.current > 5500) {
            calculateTopValue();
        }
    });

    const handlePointerDown = (e) => {
        if (isRemoteRoll) return;
        e.stopPropagation();

        try {
            e.target.setPointerCapture(e.pointerId);
        } catch {}

        isDraggingRef.current = true;
        isSettledRef.current = true;
        dragHistoryRef.current = [];

        document.body.style.cursor = 'grabbing';

        if (rigidBodyRef.current) {
            rigidBodyRef.current.setGravityScale(0, true);
            rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
            rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
        }
    };

    const handlePointerMove = (e) => {
        if (isRemoteRoll || !isDraggingRef.current || !rigidBodyRef.current) return;
        e.stopPropagation();

        const targetPoint = new THREE.Vector3();
        if (e.ray && e.ray.intersectPlane(DRAG_PLANE, targetPoint)) {
            const clampedX = THREE.MathUtils.clamp(targetPoint.x, -safeLimitX, safeLimitX);
            const clampedZ = THREE.MathUtils.clamp(targetPoint.z, -safeLimitZ, safeLimitZ);

            rigidBodyRef.current.setTranslation(
                { x: clampedX, y: 2.6, z: clampedZ },
                true
            );

            const now = performance.now();
            dragHistoryRef.current.push({ x: clampedX, z: clampedZ, time: now });
            if (dragHistoryRef.current.length > 5) {
                dragHistoryRef.current.shift();
            }
        }
    };

    const handlePointerUp = (e) => {
        if (isRemoteRoll || !isDraggingRef.current || !rigidBodyRef.current) return;
        e.stopPropagation();

        try {
            e.target.releasePointerCapture(e.pointerId);
        } catch {}

        isDraggingRef.current = false;
        document.body.style.cursor = 'default';

        rigidBodyRef.current.setGravityScale(1, true);

        let vx = (Math.random() - 0.5) * 4;
        let vz = (Math.random() - 0.5) * 4;

        const history = dragHistoryRef.current;
        let lastPos = { x: 0, z: 0 };
        if (history.length >= 2) {
            const first = history[0];
            const last = history[history.length - 1];
            lastPos = last;
            const dt = Math.max(16, last.time - first.time) / 1000;

            const calcVx = (last.x - first.x) / dt;
            const calcVz = (last.z - first.z) / dt;

            vx = THREE.MathUtils.clamp(calcVx * 0.75, -20, 20);
            vz = THREE.MathUtils.clamp(calcVz * 0.75, -20, 20);
        }

        const vy = -4 - Math.random() * 4;
        const finalVelocity = { x: vx, y: vy, z: vz };
        const finalAngvel = {
            x: (Math.random() - 0.5) * 40,
            y: (Math.random() - 0.5) * 40,
            z: (Math.random() - 0.5) * 40,
        };

        rigidBodyRef.current.setLinvel(finalVelocity, true);
        rigidBodyRef.current.setAngvel(finalAngvel, true);

        diceAudio.playThrow(1);

        spawnTimeRef.current = Date.now();
        stableFrameCounter.current = 0;
        isSettledRef.current = false;

        broadcastReThrow(
            id,
            { x: lastPos.x, y: 2.6, z: lastPos.z },
            finalVelocity,
            finalAngvel
        );
    };

    return (
        <RigidBody
            ref={rigidBodyRef}
            colliders="hull"
            ccd={true}
            position={initialPos}
            rotation={initialRotation}
            linearVelocity={initialLinearVelocity}
            angularVelocity={initialAngularVelocity}
            restitution={0.46}
            friction={0.5}
            linearDamping={0.08}
            angularDamping={0.12}
            onCollisionEnter={handleCollision}
        >
            <mesh
                userData={{ isDie: true }}
                geometry={geometry}
                material={materials}
                castShadow
                receiveShadow
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onPointerOver={() => {
                    if (!isRemoteRoll && !isDraggingRef.current) document.body.style.cursor = 'grab';
                }}
                onPointerOut={() => {
                    if (!isRemoteRoll && !isDraggingRef.current) document.body.style.cursor = 'default';
                }}
            />
        </RigidBody>
    );
}