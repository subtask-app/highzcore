'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function PlayButton3D() {
  const meshRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(time * 0.5) * 0.4;
      meshRef.current.rotation.x = Math.cos(time * 0.3) * 0.2;
    }

    if (particlesRef.current) {
      particlesRef.current.rotation.y = time * 0.3;
      particlesRef.current.rotation.x = time * 0.1;
    }
  });

  // Create particle system
  const particles = useMemo(() => {
    const count = 100;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 0.6 + Math.random() * 0.4;

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
    }

    return positions;
  }, []);

  // Create play button triangle
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.5);
  shape.lineTo(0.433, 0);
  shape.lineTo(0, -0.5);
  shape.lineTo(0, 0.5);

  const extrudeSettings = {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.05,
    bevelSegments: 8,
  };

  return (
    <group>
      {/* Particle system */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particles.length / 3}
            array={particles}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          color="#8b5cf6"
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>

      {/* Main 3D play button */}
      <Float speed={2.5} rotationIntensity={0.8} floatIntensity={0.6}>
        <mesh ref={meshRef} castShadow receiveShadow>
          <extrudeGeometry args={[shape, extrudeSettings]} />
          <meshStandardMaterial
            color="#ef4444"
            metalness={0.8}
            roughness={0.2}
            emissive="#ef4444"
            emissiveIntensity={0.3}
          />
        </mesh>

        {/* Inner glow sphere */}
        <Sphere args={[0.4, 32, 32]} scale={0.9}>
          <MeshDistortMaterial
            color="#8b5cf6"
            transparent
            opacity={0.3}
            distort={0.3}
            speed={2}
          />
        </Sphere>

        {/* Outer ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={1.8}>
          <torusGeometry args={[0.38, 0.04, 16, 64]} />
          <meshStandardMaterial
            color="#8b5cf6"
            transparent
            opacity={0.7}
            emissive="#8b5cf6"
            emissiveIntensity={0.4}
          />
        </mesh>
      </Float>
    </group>
  );
}

export default function Logo3D() {
  return (
    <div className="w-12 h-12 relative">
      <Canvas camera={{ position: [0, 0, 3.5], fov: 30 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
        <pointLight position={[-3, -3, -3]} intensity={0.8} color="#8b5cf6" />
        <pointLight position={[3, 3, 3]} intensity={0.5} color="#ef4444" />
        <PlayButton3D />
      </Canvas>

      {/* Multiple animated glow layers */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-purple-600 rounded-full blur-xl opacity-40 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full blur-2xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
    </div>
  );
}
