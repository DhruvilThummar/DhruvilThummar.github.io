'use client';

import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

function InteractiveGlassSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetRotation = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Calculate normalized mouse coordinates (-1 to 1)
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;

      targetRotation.current.x = y * 0.6;
      targetRotation.current.y = x * 0.6;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    // Smooth damp rotation towards target cursor position
    meshRef.current.rotation.x += (targetRotation.current.x - meshRef.current.rotation.x) * (delta * 4);
    meshRef.current.rotation.y += (targetRotation.current.y - meshRef.current.rotation.y) * (delta * 4);
    // Continuous subtle floating rotation axis
    meshRef.current.rotation.z += delta * 0.2;
  });

  return (
    <Float speed={2} rotationIntensity={0.6} floatIntensity={0.8}>
      <group>
        {/* Outer Luminous Refractive Glass Sphere */}
        <mesh ref={meshRef} scale={1.8}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshPhysicalMaterial
            roughness={0.05}
            metalness={0.1}
            transmission={0.92}
            ior={1.5}
            thickness={1.2}
            transparent={true}
            opacity={0.9}
            reflectivity={0.9}
            clearcoat={1}
            clearcoatRoughness={0.1}
            color="#FFFFFF"
          />
        </mesh>

        {/* Inner Glowing Core (#0066CC Deep Apple Blue) */}
        <mesh scale={0.95}>
          <icosahedronGeometry args={[1, 4]} />
          <meshStandardMaterial
            color="#0066CC"
            emissive="#004499"
            emissiveIntensity={0.6}
            roughness={0.2}
            metalness={0.8}
            wireframe={true}
          />
        </mesh>

        {/* Inner Light Core Sphere */}
        <mesh scale={0.5}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial color="#00BFFF" />
        </mesh>
      </group>
    </Float>
  );
}

export function AbstractHero() {
  return (
    <div className="w-full h-full min-h-[350px] sm:min-h-[450px] relative flex items-center justify-center">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          if (typeof window !== 'undefined') {
            gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
          }
        }}
        className="w-full h-full"
      >
        {/* Lights for Refraction & Glow */}
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={3} color="#0066CC" />
        <pointLight position={[-10, -10, -10]} intensity={2} color="#00BFFF" />
        <directionalLight position={[0, 5, 5]} intensity={2} color="#FFFFFF" />

        <InteractiveGlassSphere />
      </Canvas>
    </div>
  );
}

export default AbstractHero;
