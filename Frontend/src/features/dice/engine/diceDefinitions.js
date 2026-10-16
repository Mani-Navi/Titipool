import * as THREE from 'three';

function applyPlanarUVs(geom, faces, trianglesPerFace, faceRadius) {
    const pos = geom.attributes.position;
    const uvs = [];
    geom.clearGroups();

    for (let f = 0; f < faces.length; f++) {
        const normal = faces[f].normal;

        let upRef = new THREE.Vector3(0, 1, 0);
        if (Math.abs(normal.dot(upRef)) > 0.88) {
            upRef.set(0, 0, 1);
        }
        const tangent = new THREE.Vector3().crossVectors(upRef, normal).normalize();
        const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();

        const faceCenter = new THREE.Vector3();
        const startIndex = f * trianglesPerFace * 3;
        const totalVerts = trianglesPerFace * 3;

        for (let v = 0; v < totalVerts; v++) {
            faceCenter.add(new THREE.Vector3().fromBufferAttribute(pos, startIndex + v));
        }
        faceCenter.divideScalar(totalVerts);

        for (let v = 0; v < totalVerts; v++) {
            const vert = new THREE.Vector3().fromBufferAttribute(pos, startIndex + v);
            const diff = new THREE.Vector3().subVectors(vert, faceCenter);

            const u = 0.5 + (diff.dot(tangent) / (faceRadius * 2));
            const vCoord = 0.5 + (diff.dot(bitangent) / (faceRadius * 2));
            uvs.push(u, vCoord);
        }

        geom.addGroup(startIndex, totalVerts, f);
    }

    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.computeVertexNormals();
}

// ---------------- D2 (سکه دوطرفه / Coin) ----------------
function createD2Data() {
    const radius = 0.95;
    const height = 0.22;
    const geom = new THREE.CylinderGeometry(radius, radius, height, 28).toNonIndexed();
    geom.clearGroups();

    // گروه 0: وجه بالا (شیر / 1)، گروه 1: وجه پایین (خط / 2)، گروه 2: لبه سکه
    const segs = 28;
    const topVerts = segs * 3;
    const bottomVerts = segs * 3;
    const sideVerts = segs * 6;

    geom.addGroup(0, topVerts, 0);
    geom.addGroup(topVerts, bottomVerts, 1);
    geom.addGroup(topVerts + bottomVerts, sideVerts, 0);

    const faces = [
        { normal: new THREE.Vector3(0, 1, 0), value: 1, label: 'شیر' },
        { normal: new THREE.Vector3(0, -1, 0), value: 2, label: 'خط' },
    ];

    return {
        type: 'd2',
        radius,
        faces,
        createGeometry: () => geom.clone(),
    };
}

// ---------------- D4 ----------------
function createD4Data() {
    const radius = 0.98;
    const geom = new THREE.TetrahedronGeometry(radius, 0).toNonIndexed();
    const pos = geom.attributes.position;
    const faces = [];
    const values = [1, 2, 3, 4];

    for (let i = 0; i < 4; i++) {
        const vA = new THREE.Vector3().fromBufferAttribute(pos, i * 3);
        const vB = new THREE.Vector3().fromBufferAttribute(pos, i * 3 + 1);
        const vC = new THREE.Vector3().fromBufferAttribute(pos, i * 3 + 2);
        const normal = new THREE.Vector3().subVectors(vC, vB).cross(new THREE.Vector3().subVectors(vA, vB)).normalize();
        faces.push({ normal, value: values[i] });
    }

    applyPlanarUVs(geom, faces, 1, radius * 1.05);
    return { type: 'd4', radius, faces, createGeometry: () => geom.clone() };
}

// ---------------- D6 ----------------
export const D6_DEFINITION = {
    type: 'd6',
    radius: 0.72,
    faces: [
        { normal: new THREE.Vector3( 0,  1,  0), value: 6 },
        { normal: new THREE.Vector3( 0, -1,  0), value: 1 },
        { normal: new THREE.Vector3( 1,  0,  0), value: 3 },
        { normal: new THREE.Vector3(-1,  0,  0), value: 4 },
        { normal: new THREE.Vector3( 0,  0,  1), value: 5 },
        { normal: new THREE.Vector3( 0,  0, -1), value: 2 },
    ],
    createGeometry: () => new THREE.BoxGeometry(1.0, 1.0, 1.0),
};

// ---------------- FORGE (تاس ۶ وجهی اساطیری سرنوشت) ----------------
export const FORGE_DEFINITION = {
    type: 'forge',
    radius: 0.75,
    faces: [
        { normal: new THREE.Vector3( 0,  1,  0), value: 2, label: '⚒️ +2' },
        { normal: new THREE.Vector3( 0, -1,  0), value: -2, label: '💀 -2' },
        { normal: new THREE.Vector3( 1,  0,  0), value: 1, label: '⚔️ +1' },
        { normal: new THREE.Vector3(-1,  0,  0), value: 1, label: '🛡️ +1' },
        { normal: new THREE.Vector3( 0,  0,  1), value: -1, label: '🔥 -1' },
        { normal: new THREE.Vector3( 0,  0, -1), value: 0, label: '⚡ 0' },
    ],
    createGeometry: () => new THREE.BoxGeometry(1.04, 1.04, 1.04),
};

// ---------------- D8 ----------------
function createD8Data() {
    const radius = 0.96;
    const geom = new THREE.OctahedronGeometry(radius, 0).toNonIndexed();
    const pos = geom.attributes.position;
    const faces = [];
    const d8Values = [1, 8, 2, 7, 3, 6, 4, 5];

    for (let i = 0; i < 8; i++) {
        const vA = new THREE.Vector3().fromBufferAttribute(pos, i * 3);
        const vB = new THREE.Vector3().fromBufferAttribute(pos, i * 3 + 1);
        const vC = new THREE.Vector3().fromBufferAttribute(pos, i * 3 + 2);
        const normal = new THREE.Vector3().subVectors(vC, vB).cross(new THREE.Vector3().subVectors(vA, vB)).normalize();
        faces.push({ normal, value: d8Values[i] });
    }

    applyPlanarUVs(geom, faces, 1, radius * 1.05);
    return { type: 'd8', radius, faces, createGeometry: () => geom.clone() };
}

// ---------------- D10, D100 & D1000 ----------------
function createD10GeometryData(mode = 'd10') {
    const H = 0.92;
    const R = 0.88;
    const h = H * 0.105572809;

    const topPole = new THREE.Vector3(0, H, 0);
    const bottomPole = new THREE.Vector3(0, -H, 0);

    const ring = [];
    for (let i = 0; i < 10; i++) {
        const angle = (i * Math.PI) / 5;
        const y = i % 2 === 0 ? h : -h;
        ring.push(new THREE.Vector3(Math.cos(angle) * R, y, Math.sin(angle) * R));
    }

    const positions = [];
    const uvs = [];
    const faces = [];

    let upperValues = [0, 2, 4, 6, 8];
    let lowerValues = [9, 7, 5, 3, 1];

    if (mode === 'd100') {
        upperValues = [0, 20, 40, 60, 80];
        lowerValues = [90, 70, 50, 30, 10];
    } else if (mode === 'd1000') {
        upperValues = [0, 200, 400, 600, 800];
        lowerValues = [900, 700, 500, 300, 100];
    }

    function addFlatKite(pApex, pWaistRight, pOppositeTip, pWaistLeft, faceValue) {
        const center = new THREE.Vector3()
            .add(pApex)
            .add(pOppositeTip)
            .add(pWaistRight)
            .add(pWaistLeft)
            .multiplyScalar(0.25);

        const diagLong = new THREE.Vector3().subVectors(pOppositeTip, pApex);
        const diagWaist = new THREE.Vector3().subVectors(pWaistLeft, pWaistRight);
        let normal = new THREE.Vector3().crossVectors(diagLong, diagWaist).normalize();
        if (normal.dot(center) < 0) {
            normal.negate();
        }
        faces.push({ normal, value: faceValue });

        const upUV = new THREE.Vector3().subVectors(pApex, center).normalize();
        const rightUV = new THREE.Vector3().crossVectors(upUV, normal).normalize();

        const scale = 1.48;
        function getUV(pt) {
            const d = new THREE.Vector3().subVectors(pt, center);
            return [0.5 + d.dot(rightUV) / scale, 0.5 + d.dot(upUV) / scale];
        }

        const uvApex = getUV(pApex);
        const uvTip = getUV(pOppositeTip);
        const uvR = getUV(pWaistRight);
        const uvL = getUV(pWaistLeft);

        positions.push(...pApex.toArray(), ...pWaistLeft.toArray(), ...pOppositeTip.toArray());
        uvs.push(...uvApex, ...uvL, ...uvTip);

        positions.push(...pApex.toArray(), ...pOppositeTip.toArray(), ...pWaistRight.toArray());
        uvs.push(...uvApex, ...uvTip, ...uvR);
    }

    for (let i = 0; i < 5; i++) {
        const pApex = topPole;
        const pBottomTip = ring[(i * 2 + 1) % 10];
        const pWaistRight = ring[i * 2];
        const pWaistLeft = ring[(i * 2 + 2) % 10];
        addFlatKite(pApex, pWaistRight, pBottomTip, pWaistLeft, upperValues[i]);
    }

    for (let i = 0; i < 5; i++) {
        const pApex = bottomPole;
        const pTopTip = ring[(i * 2 + 2) % 10];
        const pWaistRight = ring[(i * 2 + 3) % 10];
        const pWaistLeft = ring[(i * 2 + 1) % 10];
        addFlatKite(pApex, pWaistRight, pTopTip, pWaistLeft, lowerValues[i]);
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geom.clearGroups();

    for (let f = 0; f < 10; f++) {
        geom.addGroup(f * 6, 6, f);
    }
    geom.computeVertexNormals();

    return {
        type: mode,
        radius: R,
        faces,
        createGeometry: () => geom.clone(),
    };
}

// ---------------- D12 ----------------
function createD12Data() {
    const radius = 0.98;
    const geom = new THREE.DodecahedronGeometry(radius, 0).toNonIndexed();
    const pos = geom.attributes.position;
    const faces = [];
    const d12Values = [1, 12, 2, 11, 3, 10, 4, 9, 5, 8, 6, 7];

    for (let i = 0; i < 12; i++) {
        const vA = new THREE.Vector3().fromBufferAttribute(pos, i * 9);
        const vB = new THREE.Vector3().fromBufferAttribute(pos, i * 9 + 1);
        const vC = new THREE.Vector3().fromBufferAttribute(pos, i * 9 + 2);
        const normal = new THREE.Vector3().subVectors(vC, vB).cross(new THREE.Vector3().subVectors(vA, vB)).normalize();
        faces.push({ normal, value: d12Values[i] });
    }

    applyPlanarUVs(geom, faces, 3, radius * 0.95);
    return { type: 'd12', radius, faces, createGeometry: () => geom.clone() };
}

// ---------------- D20 ----------------
function createD20Data() {
    const radius = 0.94;
    const geom = new THREE.IcosahedronGeometry(radius, 0).toNonIndexed();
    const pos = geom.attributes.position;
    const faces = [];
    const d20Values = [
        20, 1, 18, 4, 14, 8, 16, 6, 12, 10,
        11, 9, 15, 7, 13, 5, 17, 3, 19, 2
    ];

    for (let i = 0; i < 20; i++) {
        const vA = new THREE.Vector3().fromBufferAttribute(pos, i * 3);
        const vB = new THREE.Vector3().fromBufferAttribute(pos, i * 3 + 1);
        const vC = new THREE.Vector3().fromBufferAttribute(pos, i * 3 + 2);
        const normal = new THREE.Vector3().subVectors(vC, vB).cross(new THREE.Vector3().subVectors(vA, vB)).normalize();
        faces.push({ normal, value: d20Values[i] });
    }

    applyPlanarUVs(geom, faces, 1, radius * 0.9);
    return { type: 'd20', radius, faces, createGeometry: () => geom.clone() };
}

export const DICE_CONFIGS = {
    d2: createD2Data(),
    d4: createD4Data(),
    d6: D6_DEFINITION,
    forge: FORGE_DEFINITION,
    d8: createD8Data(),
    d10: createD10GeometryData('d10'),
    d100: createD10GeometryData('d100'),
    d1000: createD10GeometryData('d1000'),
    d12: createD12Data(),
    d20: createD20Data(),
};