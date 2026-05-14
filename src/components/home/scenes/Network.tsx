'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import { InstancedMesh, Object3D } from 'three';

// ───── Core orb (the platform) ───────────────────────────────────────────────

function CoreOrb() {
  const ref = useRef<any>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.08;
  });
  return (
    <group ref={ref}>
      {/* glow shell */}
      <mesh scale={1.25}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.05} />
      </mesh>
      {/* core */}
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color="#0ea5e9"
          emissive="#1d4ed8"
          emissiveIntensity={0.25}
          distort={0.22}
          speed={0.8}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>
    </group>
  );
}

// ───── Creator nodes orbiting the core ───────────────────────────────────────

const CREATOR_POSITIONS: ReadonlyArray<[number, number, number]> = [
  [-2.4,  0.6, -0.4],
  [-2.0, -0.3,  0.9],
  [-3.0,  0.1,  0.2],
  [ 2.2,  0.4, -0.6],
  [ 2.6, -0.2,  0.8],
  [ 1.8,  0.7,  0.1],
];

function CreatorNodes() {
  const group = useRef<any>(null);
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.025;
  });
  return (
    <group ref={group}>
      {CREATOR_POSITIONS.map((p, i) => (
        <Float key={i} speed={0.7 + i * 0.05} rotationIntensity={0.15} floatIntensity={0.25}>
          <mesh position={p}>
            <icosahedronGeometry args={[0.22, 1]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? '#22d3ee' : '#60a5fa'}
              emissive={i % 2 === 0 ? '#0891b2' : '#1d4ed8'}
              emissiveIntensity={0.18}
              roughness={0.4}
              metalness={0.3}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

// ───── Worker dots — instanced for cheap rendering ──────────────────────────

const WORKER_COUNT = 70;

function WorkerDots() {
  const meshRef = useRef<InstancedMesh>(null);
  const tmp = useMemo(() => new Object3D(), []);

  const seeds = useMemo(() => {
    return new Array(WORKER_COUNT).fill(0).map(() => ({
      r: 3.6 + Math.random() * 2.4,           // orbit radius — push them outward, away from text
      theta: Math.random() * Math.PI * 2,
      phi: (Math.random() - 0.5) * 0.5,
      speed: 0.02 + Math.random() * 0.06,    // ~3× slower
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < WORKER_COUNT; i++) {
      const s = seeds[i];
      const theta = s.theta + t * s.speed + s.offset;
      const x = Math.cos(theta) * s.r;
      const z = Math.sin(theta) * s.r;
      const y = Math.sin(t * 0.18 + s.offset) * 0.25 + s.phi * 1.4;
      tmp.position.set(x, y, z);
      tmp.scale.setScalar(0.035);
      tmp.updateMatrix();
      meshRef.current.setMatrixAt(i, tmp.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, WORKER_COUNT] as any}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#7dd3fc" transparent opacity={0.7} toneMapped={false} />
    </instancedMesh>
  );
}

// ───── Top-level network composition ────────────────────────────────────────
// Atmosphere only — the role picker lives in the HTML CTA section, not here.

export default function Network() {
  return (
    <>
      {/* lighting */}
      <ambientLight intensity={0.25} />
      <pointLight position={[6, 4, 4]} intensity={0.7} color="#60a5fa" />
      <pointLight position={[-6, -3, 4]} intensity={0.5} color="#22d3ee" />

      {/* main network around origin */}
      <CoreOrb />
      <CreatorNodes />
      <WorkerDots />
      <Sparkles count={45} scale={[14, 7, 12]} size={1.6} speed={0.12} color="#7dd3fc" opacity={0.55} />
    </>
  );
}
