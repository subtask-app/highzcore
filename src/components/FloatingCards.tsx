'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox, Float } from '@react-three/drei';
import * as THREE from 'three';

function FloatingCard({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.5) * 0.3;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
      <RoundedBox ref={meshRef} args={[1, 1.4, 0.1]} radius={0.05} position={position}>
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </RoundedBox>
    </Float>
  );
}

export default function FloatingCards() {
  return (
    <div className="w-full h-full absolute inset-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, -5, -5]} intensity={0.3} color="#a78bfa" />

        <FloatingCard position={[-2, 1, 0]} color="#8b5cf6" />
        <FloatingCard position={[2, -0.5, -1]} color="#60a5fa" />
        <FloatingCard position={[0, -1.5, 0.5]} color="#ec4899" />
      </Canvas>
    </div>
  );
}
