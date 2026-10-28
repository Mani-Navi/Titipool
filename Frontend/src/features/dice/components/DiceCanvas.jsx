// src/features/dice/components/DiceCanvas.jsx
import React, { Suspense, useEffect, useRef, memo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { Tray } from './Tray';
import { Die } from './Die';
import { useDiceStore } from '../state/dice.store';

function ClickThroughManager() {
    const { camera, scene, gl } = useThree();
    const activeDice = useDiceStore((s) => s.activeDice);
    const diceMeshesRef = useRef([]);
    const raycasterRef = useRef(new THREE.Raycaster());
    const mouseRef = useRef(new THREE.Vector2());
    const rectRef = useRef(null);

    useEffect(() => {
        if (activeDice.length === 0) {
            diceMeshesRef.current = [];
            if (gl.domElement) {
                gl.domElement.style.pointerEvents = 'none';
            }
            return;
        }

        const meshes = [];
        scene.traverse((obj) => {
            if (obj.isMesh && obj.userData?.isDie) {
                meshes.push(obj);
            }
        });
        diceMeshesRef.current = meshes;
        if (gl.domElement) {
            rectRef.current = gl.domElement.getBoundingClientRect();
        }
    }, [activeDice, scene, gl]);

    useEffect(() => {
        if (activeDice.length === 0) return;

        let isHoveredOnDie = false;
        let rafId = null;
        let lastClientX = 0;
        let lastClientY = 0;

        const updateRect = () => {
            if (gl.domElement) {
                rectRef.current = gl.domElement.getBoundingClientRect();
            }
        };

        const processRaycast = () => {
            rafId = null;
            if (!gl.domElement) return;

            if (document.body.style.cursor === 'grabbing') {
                if (gl.domElement.style.pointerEvents !== 'auto') {
                    gl.domElement.style.pointerEvents = 'auto';
                }
                return;
            }

            const meshes = diceMeshesRef.current;
            if (!meshes || meshes.length === 0) {
                if (gl.domElement.style.pointerEvents !== 'none') {
                    gl.domElement.style.pointerEvents = 'none';
                }
                return;
            }

            const rect = rectRef.current || gl.domElement.getBoundingClientRect();
            if (!rectRef.current) rectRef.current = rect;
            if (rect.width === 0 || rect.height === 0) return;

            mouseRef.current.x = ((lastClientX - rect.left) / rect.width) * 2 - 1;
            mouseRef.current.y = -((lastClientY - rect.top) / rect.height) * 2 + 1;

            raycasterRef.current.setFromCamera(mouseRef.current, camera);
            const intersects = raycasterRef.current.intersectObjects(meshes, false);
            const hitsDie = intersects.length > 0;

            if (hitsDie) {
                if (!isHoveredOnDie) {
                    isHoveredOnDie = true;
                    gl.domElement.style.pointerEvents = 'auto';
                }
            } else if (isHoveredOnDie) {
                isHoveredOnDie = false;
                gl.domElement.style.pointerEvents = 'none';
            }
        };

        const handlePointerMove = (e) => {
            lastClientX = e.clientX;
            lastClientY = e.clientY;
            if (rafId === null) {
                rafId = window.requestAnimationFrame(processRaycast);
            }
        };

        gl.domElement.style.pointerEvents = 'none';

        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        window.addEventListener('resize', updateRect, { passive: true });
        window.addEventListener('scroll', updateRect, { passive: true });

        return () => {
            if (rafId !== null) {
                window.cancelAnimationFrame(rafId);
            }
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('resize', updateRect);
            window.removeEventListener('scroll', updateRect);
            if (gl.domElement) {
                gl.domElement.style.pointerEvents = 'none';
            }
        };
    }, [camera, gl, activeDice.length]);

    return null;
}

const ActiveDiceRenderer = memo(({ overlayMode }) => {
    const activeDice = useDiceStore((s) => s.activeDice);
    return (
        <>
            {activeDice.map((die) => (
                <Die key={die.id} {...die} overlayMode={overlayMode} />
            ))}
        </>
    );
});

ActiveDiceRenderer.displayName = 'ActiveDiceRenderer';

export const DiceCanvas = memo(({ overlayMode = false }) => {
    const activeDiceCount = useDiceStore((s) => s.activeDice.length);

    return (
        <Canvas
            shadows
            gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
            camera={{ position: [0, 16, 0.01], fov: 45 }}
            style={{
                width: '100%',
                height: '100%',
                pointerEvents: overlayMode ? 'none' : (activeDiceCount > 0 ? 'auto' : 'none'),
                touchAction: 'none',
            }}
        >
            <ambientLight intensity={0.85} color="#ffffff" />

            <directionalLight
                position={[2, 22, 3]}
                intensity={1.8}
                castShadow
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                shadow-camera-near={0.5}
                shadow-camera-far={40}
                shadow-camera-left={-25}
                shadow-camera-right={25}
                shadow-camera-top={25}
                shadow-camera-bottom={-25}
                shadow-bias={-0.00015}
            />

            <pointLight position={[-8, 12, -8]} intensity={0.4} color="#e0e7ff" />

            {overlayMode && <ClickThroughManager />}

            <Suspense fallback={null}>
                <Physics gravity={[0, -32, 0]} timeStep={1 / 60}>
                    <Tray />
                    <ActiveDiceRenderer overlayMode={overlayMode} />
                </Physics>
            </Suspense>
        </Canvas>
    );
});

DiceCanvas.displayName = 'DiceCanvas';
export default DiceCanvas;