'use client';

import { useFrame, useThree } from '@react-three/fiber';
import { Vector3 } from 'three';
import type { MutableRefObject } from 'react';

// Camera waypoints along scroll progress (0..1).
// Each entry is `{ at: progress, pos: [x,y,z], look: [x,y,z] }`.
// Between waypoints we lerp with smoothstep easing.
//
// The path is a gentle orbit around the core network — atmosphere, never
// drawing the eye away from the HTML story. The role picker lives in HTML.
const WAYPOINTS: ReadonlyArray<{ at: number; pos: [number, number, number]; look: [number, number, number] }> = [
  { at: 0.0,  pos: [ 0.0,  0.8,  8.0], look: [0, 0, 0] }, // hero — wide intro
  { at: 0.25, pos: [-3.0,  0.6,  5.0], look: [0, 0, 0] }, // swing left (creators side)
  { at: 0.50, pos: [ 3.0,  0.6,  5.0], look: [0, 0, 0] }, // swing right (workers side)
  { at: 0.75, pos: [ 0.0,  3.8,  5.0], look: [0, 0, 0] }, // lift overhead (marketplace POV)
  { at: 1.0,  pos: [ 0.0,  0.6,  6.5], look: [0, 0, 0] }, // settle behind the role picker
];

interface CameraRigProps {
  progressRef: MutableRefObject<number>;
}

const tmpPos = new Vector3();
const tmpLook = new Vector3();

export default function CameraRig({ progressRef }: CameraRigProps) {
  const { camera } = useThree();

  useFrame(() => {
    const p = progressRef.current;

    // Find the segment we're in.
    let i = 0;
    while (i < WAYPOINTS.length - 1 && p > WAYPOINTS[i + 1].at) i++;
    const a = WAYPOINTS[i];
    const b = WAYPOINTS[Math.min(i + 1, WAYPOINTS.length - 1)];
    const span = Math.max(0.0001, b.at - a.at);
    const t = Math.min(1, Math.max(0, (p - a.at) / span));
    const eased = t * t * (3 - 2 * t); // smoothstep

    tmpPos.set(
      a.pos[0] + (b.pos[0] - a.pos[0]) * eased,
      a.pos[1] + (b.pos[1] - a.pos[1]) * eased,
      a.pos[2] + (b.pos[2] - a.pos[2]) * eased,
    );
    tmpLook.set(
      a.look[0] + (b.look[0] - a.look[0]) * eased,
      a.look[1] + (b.look[1] - a.look[1]) * eased,
      a.look[2] + (b.look[2] - a.look[2]) * eased,
    );

    // Damped follow so micro scroll jitter doesn't whip the camera.
    camera.position.lerp(tmpPos, 0.12);
    camera.lookAt(tmpLook);
  });

  return null;
}
