'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Physics,
  RigidBody,
  CuboidCollider,
  RapierRigidBody,
} from '@react-three/rapier';
import {
  KeyboardControls,
  useKeyboardControls,
  Environment,
  ContactShadows,
} from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { RefreshCw, Zap, Flame, Gauge } from 'lucide-react';

// ==========================================
// 🎮 Keyboard Control Enum & Mapping
// ==========================================
export enum ControlKeys {
  forward = 'forward',
  backward = 'backward',
  left = 'left',
  right = 'right',
  brake = 'brake',
  boost = 'boost',
  reset = 'reset',
}

const keyboardMap = [
  { name: ControlKeys.forward, keys: ['KeyW', 'ArrowUp'] },
  { name: ControlKeys.backward, keys: ['KeyS', 'ArrowDown'] },
  { name: ControlKeys.left, keys: ['KeyA', 'ArrowLeft'] },
  { name: ControlKeys.right, keys: ['KeyD', 'ArrowRight'] },
  { name: ControlKeys.brake, keys: ['Space'] },
  { name: ControlKeys.boost, keys: ['ShiftLeft', 'ShiftRight', 'KeyE'] },
  { name: ControlKeys.reset, keys: ['KeyR'] },
];

export interface MobileControlsState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
  boost: boolean;
}

interface VehicleProps {
  mobileControls: MobileControlsState;
  onSpeedUpdate: (speedKmh: number, isBoosting: boolean) => void;
  resetTrigger: number;
  isInView: boolean;
}

interface SmashableObjectItem {
  id: number;
  type: 'glassCube' | 'metallicSphere' | 'neonPrism';
  position: [number, number, number];
  scale: number;
}

// ==========================================
// 💡 Zero-GC Static Vector Singletons (60FPS Physics Loop Guard)
// ==========================================
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _resetQuat = new THREE.Quaternion();
const _forwardVec = new THREE.Vector3();
const _rightVec = new THREE.Vector3();
const _upVec = new THREE.Vector3();
const _currentVel = new THREE.Vector3();
const _impulseForce = new THREE.Vector3();
const _counterForce = new THREE.Vector3();
const _brakeForce = new THREE.Vector3();
const _carPos = new THREE.Vector3();
const _camOffset = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _lookAtOffset = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();

// ==========================================
// 🏎️ 1. Ultra-Detailed Procedural Racing Wheel
// ==========================================
interface WheelAssemblyProps {
  wheelRef: React.RefObject<THREE.Group | null>;
  position: [number, number, number];
  isFront?: boolean;
  isRightSide?: boolean;
}

function WheelAssembly({ wheelRef, position, isRightSide = false }: WheelAssemblyProps) {
  return (
    <group ref={wheelRef} position={position}>
      {/* Outer Rotating Wheel Assembly */}
      <group>
        {/* Wide High-Performance Rubber Tire */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.34, 0.34, 0.28, 28]} />
          <meshStandardMaterial
            color="#08080A"
            roughness={0.75}
            metalness={0.1}
          />
        </mesh>

        {/* Outer Wheel Rim Lip (Machined Diamond-Cut Alloy) */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.285, 24]} />
          <meshStandardMaterial
            color="#27272A"
            metalness={0.92}
            roughness={0.15}
          />
        </mesh>

        {/* 5-Twin-Spoke Machined Alloy Rim Spokes */}
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i * Math.PI * 2) / 5;
          return (
            <group
              key={i}
              rotation={[angle, 0, isRightSide ? 0 : Math.PI]}
              position={[isRightSide ? 0.08 : -0.08, 0, 0]}
            >
              <mesh position={[0, 0.1, 0]}>
                <boxGeometry args={[0.025, 0.16, 0.03]} />
                <meshStandardMaterial
                  color="#E4E4E7"
                  metalness={0.95}
                  roughness={0.1}
                />
              </mesh>
            </group>
          );
        })}

        {/* Central Anodized Hub Lock Nut */}
        <mesh
          position={[isRightSide ? 0.145 : -0.145, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[0.045, 0.045, 0.03, 12]} />
          <meshStandardMaterial
            color={isRightSide ? '#0066CC' : '#38BDF8'}
            metalness={0.9}
            roughness={0.2}
          />
        </mesh>
      </group>

      {/* Perforated Carbon-Ceramic Brake Rotor Disc (Non-rotating with axle) */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 0.02, 20]} />
        <meshStandardMaterial
          color="#52525B"
          metalness={0.9}
          roughness={0.35}
        />
      </mesh>

      {/* High-Performance Brembo-Style Racing Brake Caliper (Electric Cyan) */}
      <mesh
        position={[isRightSide ? -0.02 : 0.02, 0.12, 0.08]}
        rotation={[0, 0, 0]}
      >
        <boxGeometry args={[0.07, 0.1, 0.13]} />
        <meshStandardMaterial
          color="#38BDF8"
          emissive="#0066CC"
          emissiveIntensity={0.6}
          roughness={0.25}
          metalness={0.7}
        />
      </mesh>
    </group>
  );
}

// ==========================================
// 🏎️ 2. Futuristic Hypercar Body (Aerodynamic Masterpiece)
// ==========================================
interface HypercarBodyProps {
  isAccelerating: boolean;
  isBoosting: boolean;
  isBraking: boolean;
}

function HypercarBody({ isAccelerating, isBoosting, isBraking }: HypercarBodyProps) {
  return (
    <group position={[0, 0, 0]}>
      {/* ── Carbon Ground-Effect Underbody Floorpan & Splitter ── */}
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.92, 0.12, 4.35]} />
        <meshStandardMaterial
          color="#121216"
          roughness={0.35}
          metalness={0.85}
        />
      </mesh>

      {/* Aggressive Front Chin Splitter with Extended Corner Canards */}
      <mesh position={[0, 0.14, -2.18]} castShadow>
        <boxGeometry args={[2.02, 0.06, 0.42]} />
        <meshStandardMaterial
          color="#09090B"
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* Front Corner Aero Dive Planes (Canards) */}
      <mesh position={[-0.98, 0.28, -1.95]} rotation={[0, -0.25, 0.2]}>
        <boxGeometry args={[0.22, 0.02, 0.3]} />
        <meshStandardMaterial color="#09090B" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0.98, 0.28, -1.95]} rotation={[0, 0.25, -0.2]}>
        <boxGeometry args={[0.22, 0.02, 0.3]} />
        <meshStandardMaterial color="#09090B" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* ── Main Sculpted Aerodynamic Chassis (Jet Black Mirror Finish) ── */}
      <mesh position={[0, 0.38, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[1.86, 0.38, 3.8]} />
        <meshPhysicalMaterial
          color="#09090B"
          roughness={0.05}
          metalness={0.94}
          clearcoat={1.0}
          clearcoatRoughness={0.03}
          reflectivity={0.9}
          envMapIntensity={2.8}
        />
      </mesh>

      {/* Slanted Low-Slung Front Hood Wedge */}
      <mesh
        position={[0, 0.36, -1.35]}
        rotation={[0.12, 0, 0]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1.78, 0.22, 1.6]} />
        <meshPhysicalMaterial
          color="#09090B"
          roughness={0.05}
          metalness={0.94}
          clearcoat={1.0}
          clearcoatRoughness={0.03}
          envMapIntensity={2.8}
        />
      </mesh>

      {/* Twin Hood Air Extraction Vents (Functional Aero Louvers) */}
      <mesh position={[-0.42, 0.46, -1.2]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.26, 0.03, 0.5]} />
        <meshStandardMaterial color="#18181B" roughness={0.5} metalness={0.7} />
      </mesh>
      <mesh position={[0.42, 0.46, -1.2]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.26, 0.03, 0.5]} />
        <meshStandardMaterial color="#18181B" roughness={0.5} metalness={0.7} />
      </mesh>

      {/* Front Radiator Grille Inset (Dark Mesh) */}
      <mesh position={[0, 0.26, -2.16]}>
        <boxGeometry args={[1.2, 0.16, 0.06]} />
        <meshStandardMaterial
          color="#030712"
          roughness={0.9}
          metalness={0.3}
        />
      </mesh>

      {/* ── Wide-Body Muscular Rear Wheel Haunches ── */}
      <mesh position={[-0.88, 0.44, 0.95]} castShadow>
        <boxGeometry args={[0.3, 0.36, 1.8]} />
        <meshPhysicalMaterial
          color="#09090B"
          roughness={0.05}
          metalness={0.94}
          clearcoat={1.0}
        />
      </mesh>
      <mesh position={[0.88, 0.44, 0.95]} castShadow>
        <boxGeometry args={[0.3, 0.36, 1.8]} />
        <meshPhysicalMaterial
          color="#09090B"
          roughness={0.05}
          metalness={0.94}
          clearcoat={1.0}
        />
      </mesh>

      {/* Deep Side Air Intakes (Feeding Mid-Engine Radiators) */}
      <mesh position={[-0.94, 0.36, 0.2]} rotation={[0, 0.1, 0]}>
        <boxGeometry args={[0.08, 0.22, 0.7]} />
        <meshStandardMaterial color="#030712" roughness={0.7} />
      </mesh>
      <mesh position={[0.94, 0.36, 0.2]} rotation={[0, -0.1, 0]}>
        <boxGeometry args={[0.08, 0.22, 0.7]} />
        <meshStandardMaterial color="#030712" roughness={0.7} />
      </mesh>

      {/* Aerodynamic Side Mirrors on Carbon Stalks */}
      <group position={[-0.96, 0.62, -0.65]}>
        <mesh rotation={[0, 0, 0.4]}>
          <boxGeometry args={[0.04, 0.12, 0.03]} />
          <meshStandardMaterial color="#18181B" />
        </mesh>
        <mesh position={[-0.1, 0.06, 0]}>
          <boxGeometry args={[0.16, 0.08, 0.1]} />
          <meshPhysicalMaterial color="#09090B" metalness={0.95} clearcoat={1.0} />
        </mesh>
        <mesh position={[-0.1, 0.06, 0.05]}>
          <boxGeometry args={[0.14, 0.06, 0.01]} />
          <meshStandardMaterial color="#E4E4E7" metalness={0.98} roughness={0.05} />
        </mesh>
      </group>
      <group position={[0.96, 0.62, -0.65]}>
        <mesh rotation={[0, 0, -0.4]}>
          <boxGeometry args={[0.04, 0.12, 0.03]} />
          <meshStandardMaterial color="#18181B" />
        </mesh>
        <mesh position={[0.1, 0.06, 0]}>
          <boxGeometry args={[0.16, 0.08, 0.1]} />
          <meshPhysicalMaterial color="#09090B" metalness={0.95} clearcoat={1.0} />
        </mesh>
        <mesh position={[0.1, 0.06, 0.05]}>
          <boxGeometry args={[0.14, 0.06, 0.01]} />
          <meshStandardMaterial color="#E4E4E7" metalness={0.98} roughness={0.05} />
        </mesh>
      </group>

      {/* ── Curved Cockpit Canopy & Obsidian Glass Cockpit ── */}
      <mesh position={[0, 0.72, -0.12]} castShadow>
        <boxGeometry args={[1.38, 0.42, 2.15]} />
        <meshPhysicalMaterial
          color="#060911"
          roughness={0.04}
          metalness={0.95}
          transmission={0.55}
          transparent
          opacity={0.92}
          clearcoat={1.0}
          clearcoatRoughness={0.02}
          envMapIntensity={3.0}
        />
      </mesh>

      {/* Cockpit Roof-Mounted Ram-Air Induction Scoop */}
      <mesh position={[0, 0.94, 0.28]} rotation={[-0.08, 0, 0]} castShadow>
        <boxGeometry args={[0.38, 0.08, 0.7]} />
        <meshPhysicalMaterial color="#09090B" metalness={0.95} clearcoat={1.0} />
      </mesh>
      <mesh position={[0, 0.94, -0.07]}>
        <boxGeometry args={[0.3, 0.05, 0.04]} />
        <meshStandardMaterial color="#030712" />
      </mesh>

      {/* Minimalist Interior Silhouette (Visible through canopy) */}
      {/* Formula Steering Yoke */}
      <mesh position={[-0.26, 0.62, -0.55]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.22, 0.09, 0.03]} />
        <meshStandardMaterial color="#18181B" roughness={0.3} />
      </mesh>
      {/* Cyan Telemetry Dash Display Glow */}
      <mesh position={[-0.26, 0.64, -0.72]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.24, 0.1, 0.02]} />
        <meshStandardMaterial
          color="#38BDF8"
          emissive="#38BDF8"
          emissiveIntensity={3.5}
          toneMapped={false}
        />
      </mesh>
      {/* Dual Carbon Racing Bucket Seats */}
      <mesh position={[-0.28, 0.58, 0.08]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[0.34, 0.45, 0.32]} />
        <meshStandardMaterial color="#18181B" roughness={0.8} />
      </mesh>
      <mesh position={[0.28, 0.58, 0.08]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[0.34, 0.45, 0.32]} />
        <meshStandardMaterial color="#18181B" roughness={0.8} />
      </mesh>

      {/* ── Cyber Quad-LED Projector Headlights ── */}
      {/* Left Quad Projectors */}
      <group position={[-0.68, 0.42, -2.12]}>
        <mesh position={[-0.1, 0, 0]}>
          <boxGeometry args={[0.14, 0.06, 0.06]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#38BDF8"
            emissiveIntensity={8.0}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0.1, 0, 0]}>
          <boxGeometry args={[0.14, 0.06, 0.06]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#38BDF8"
            emissiveIntensity={8.0}
            toneMapped={false}
          />
        </mesh>
        {/* Horizontal DRL Eyebrow Blade */}
        <mesh position={[0, 0.05, 0.02]}>
          <boxGeometry args={[0.38, 0.02, 0.04]} />
          <meshStandardMaterial
            color="#60A5FA"
            emissive="#60A5FA"
            emissiveIntensity={6.0}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Right Quad Projectors */}
      <group position={[0.68, 0.42, -2.12]}>
        <mesh position={[-0.1, 0, 0]}>
          <boxGeometry args={[0.14, 0.06, 0.06]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#38BDF8"
            emissiveIntensity={8.0}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0.1, 0, 0]}>
          <boxGeometry args={[0.14, 0.06, 0.06]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#38BDF8"
            emissiveIntensity={8.0}
            toneMapped={false}
          />
        </mesh>
        {/* Horizontal DRL Eyebrow Blade */}
        <mesh position={[0, 0.05, 0.02]}>
          <boxGeometry args={[0.38, 0.02, 0.04]} />
          <meshStandardMaterial
            color="#60A5FA"
            emissive="#60A5FA"
            emissiveIntensity={6.0}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* Forward Headlight Cones (Soft Ground Illumination) */}
      <pointLight position={[-0.7, 0.45, -2.4]} intensity={2.5} distance={12} color="#38BDF8" />
      <pointLight position={[0.7, 0.45, -2.4]} intensity={2.5} distance={12} color="#38BDF8" />

      {/* ── Continuous Horizon Neon Taillight Bar (Dynamic Brake Light) ── */}
      <mesh position={[0, 0.48, 2.11]}>
        <boxGeometry args={[1.82, 0.07, 0.06]} />
        <meshStandardMaterial
          color="#EF4444"
          emissive="#EF4444"
          emissiveIntensity={isBraking ? 10.0 : 3.5}
          toneMapped={false}
        />
      </mesh>

      {/* F1-Style Low Central Rain/Brake Strobe Light */}
      <mesh position={[0, 0.18, 2.14]}>
        <boxGeometry args={[0.16, 0.08, 0.04]} />
        <meshStandardMaterial
          color="#EF4444"
          emissive="#EF4444"
          emissiveIntensity={isBraking ? 12.0 : 4.0}
          toneMapped={false}
        />
      </mesh>

      {/* Dynamic Taillight Ground Illumination */}
      <pointLight
        position={[0, 0.46, 2.35]}
        intensity={isBraking ? 5.5 : 2.0}
        distance={9}
        color="#EF4444"
      />

      {/* ── Aggressive Rear Aerodynamic Diffuser ── */}
      <group position={[0, 0.15, 2.05]}>
        <mesh>
          <boxGeometry args={[1.72, 0.1, 0.35]} />
          <meshStandardMaterial color="#09090B" metalness={0.9} roughness={0.3} />
        </mesh>
        {/* 4 Vertical Diffuser Strakes */}
        {[-0.6, -0.2, 0.2, 0.6].map((x, idx) => (
          <mesh key={idx} position={[x, -0.04, 0]}>
            <boxGeometry args={[0.03, 0.14, 0.38]} />
            <meshStandardMaterial color="#18181B" />
          </mesh>
        ))}
      </group>

      {/* ── Dual Titanium Hexagonal Exhaust Tips ── */}
      <mesh position={[-0.32, 0.42, 2.14]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.1, 6]} />
        <meshStandardMaterial color="#0284C7" metalness={0.95} roughness={0.2} />
      </mesh>
      <mesh position={[0.32, 0.42, 2.14]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.1, 6]} />
        <meshStandardMaterial color="#0284C7" metalness={0.95} roughness={0.2} />
      </mesh>

      {/* 🔥 Dynamic Nitro Boost / Exhaust Plasma Flames 🔥 */}
      {(isAccelerating || isBoosting) && (
        <group>
          {/* Left Flame Plume */}
          <mesh
            position={[-0.32, 0.42, 2.25 + (isBoosting ? 0.25 : 0.12)]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <coneGeometry args={[isBoosting ? 0.12 : 0.07, isBoosting ? 0.85 : 0.45, 8]} />
            <meshStandardMaterial
              color="#38BDF8"
              emissive={isBoosting ? '#60A5FA' : '#0284C7'}
              emissiveIntensity={isBoosting ? 12.0 : 6.0}
              toneMapped={false}
            />
          </mesh>
          {/* Right Flame Plume */}
          <mesh
            position={[0.32, 0.42, 2.25 + (isBoosting ? 0.25 : 0.12)]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <coneGeometry args={[isBoosting ? 0.12 : 0.07, isBoosting ? 0.85 : 0.45, 8]} />
            <meshStandardMaterial
              color="#38BDF8"
              emissive={isBoosting ? '#60A5FA' : '#0284C7'}
              emissiveIntensity={isBoosting ? 12.0 : 6.0}
              toneMapped={false}
            />
          </mesh>
          {/* Flame Light Glow */}
          <pointLight
            position={[0, 0.42, 2.6]}
            intensity={isBoosting ? 6.0 : 3.0}
            distance={8}
            color="#38BDF8"
          />
        </group>
      )}

      {/* ── High-Downforce Swan-Neck Carbon GT Racing Wing ── */}
      <group position={[0, 0.88, 1.88]}>
        {/* Main Aerodynamic Airfoil Blade */}
        <mesh position={[0, 0.14, 0]} castShadow>
          <boxGeometry args={[2.08, 0.04, 0.42]} />
          <meshStandardMaterial
            color="#09090B"
            roughness={0.15}
            metalness={0.88}
          />
        </mesh>
        {/* Left Wingtip Endplate with Glowing Cyan Trim */}
        <mesh position={[-1.05, 0.16, 0]}>
          <boxGeometry args={[0.04, 0.24, 0.46]} />
          <meshStandardMaterial color="#18181B" metalness={0.9} />
        </mesh>
        <mesh position={[-1.06, 0.16, 0]}>
          <boxGeometry args={[0.01, 0.22, 0.04]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#38BDF8"
            emissiveIntensity={4.0}
            toneMapped={false}
          />
        </mesh>
        {/* Right Wingtip Endplate with Glowing Cyan Trim */}
        <mesh position={[1.05, 0.16, 0]}>
          <boxGeometry args={[0.04, 0.24, 0.46]} />
          <meshStandardMaterial color="#18181B" metalness={0.9} />
        </mesh>
        <mesh position={[1.06, 0.16, 0]}>
          <boxGeometry args={[0.01, 0.22, 0.04]} />
          <meshStandardMaterial
            color="#38BDF8"
            emissive="#38BDF8"
            emissiveIntensity={4.0}
            toneMapped={false}
          />
        </mesh>
        {/* Dual Aggressive Swan-Neck Carbon Mount Struts */}
        <mesh position={[-0.45, -0.06, -0.05]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.05, 0.38, 0.08]} />
          <meshStandardMaterial color="#18181B" metalness={0.8} />
        </mesh>
        <mesh position={[0.45, -0.06, -0.05]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.05, 0.38, 0.08]} />
          <meshStandardMaterial color="#18181B" metalness={0.8} />
        </mesh>
      </group>

      {/* ── Active Cyber Neon Underglow ── */}
      <pointLight
        position={[0, 0.12, 0]}
        intensity={isBoosting ? 5.0 : 2.8}
        distance={6}
        color={isBoosting ? '#38BDF8' : '#0066CC'}
      />
    </group>
  );
}

// ==========================================
// 🏎️ 3. Full Arcade Vehicle with Rapier Dynamics & Drift Engine
// ==========================================
function ArcadeVehicle({
  mobileControls,
  onSpeedUpdate,
  resetTrigger,
  isInView,
}: VehicleProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);

  // Wheel visual refs for steering & rotational movement
  const frontLeftWheelRef = useRef<THREE.Group>(null);
  const frontRightWheelRef = useRef<THREE.Group>(null);
  const rearLeftWheelRef = useRef<THREE.Group>(null);
  const rearRightWheelRef = useRef<THREE.Group>(null);

  const [, getKeys] = useKeyboardControls<ControlKeys>();

  // Steering & wheel rotation tracking
  const currentSteerAngle = useRef(0);
  const wheelRotation = useRef(0);
  const [isBoostingState, setIsBoostingState] = useState(false);
  const [isBrakingState, setIsBrakingState] = useState(false);
  const [isAcceleratingState, setIsAcceleratingState] = useState(false);

  // Reset car position & zero out velocities
  const handleReset = () => {
    if (!rigidBodyRef.current) return;
    rigidBodyRef.current.setTranslation({ x: 0, y: 1.2, z: 0 }, true);
    rigidBodyRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
    rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
  };

  useEffect(() => {
    if (resetTrigger > 0) {
      handleReset();
    }
  }, [resetTrigger]);

  useFrame((state, delta) => {
    if (!isInView || !rigidBodyRef.current) return;

    const keys = getKeys();
    const isForward = keys.forward || mobileControls.forward;
    const isBackward = keys.backward || mobileControls.backward;
    const isLeft = keys.left || mobileControls.left;
    const isRight = keys.right || mobileControls.right;
    const isBrake = keys.brake || mobileControls.brake;
    const isBoost = keys.boost || mobileControls.boost;
    const isReset = keys.reset;

    if (isReset) {
      handleReset();
    }

    setIsAcceleratingState(Boolean(isForward));
    setIsBoostingState(Boolean(isBoost));
    setIsBrakingState(Boolean(isBrake || isBackward));

    // Vehicle orientation & linear velocity
    const linvel = rigidBodyRef.current.linvel();
    const rot = rigidBodyRef.current.rotation();
    _quat.set(rot.x, rot.y, rot.z, rot.w);

    // Direction vectors
    _forwardVec.set(0, 0, -1).applyQuaternion(_quat);
    _rightVec.set(1, 0, 0).applyQuaternion(_quat);
    _upVec.set(0, 1, 0).applyQuaternion(_quat);

    // Current speeds
    _currentVel.set(linvel.x, linvel.y, linvel.z);
    const speed = _currentVel.length();
    const forwardSpeed = _currentVel.dot(_forwardVec);
    const speedKmh = Math.round(speed * 3.6);
    onSpeedUpdate(speedKmh, isBoost);

    // ── Acceleration & Nitro Dynamics ──
    const baseAccel = 52.0;
    const boostAccel = 88.0;
    const currentAccel = isBoost ? boostAccel : baseAccel;
    const maxSpeed = isBoost ? 62.0 : 45.0; // Up to ~223 KM/H with Boost!
    const reverseAccel = 28.0;
    const steerSpeed = 2.85;

    // Apply propulsion
    if (isForward && forwardSpeed < maxSpeed) {
      _impulseForce
        .copy(_forwardVec)
        .multiplyScalar(currentAccel * rigidBodyRef.current.mass() * delta);
      rigidBodyRef.current.applyImpulse(_impulseForce, true);
    } else if (isBackward && forwardSpeed > -maxSpeed * 0.4) {
      _impulseForce
        .copy(_forwardVec)
        .multiplyScalar(-reverseAccel * rigidBodyRef.current.mass() * delta);
      rigidBodyRef.current.applyImpulse(_impulseForce, true);
    }

    // ── Steering & Drift Torque ──
    let targetSteer = 0;
    if (isLeft) targetSteer += 1;
    if (isRight) targetSteer -= 1;

    currentSteerAngle.current = THREE.MathUtils.lerp(
      currentSteerAngle.current,
      targetSteer * 0.48,
      delta * 14.0
    );

    if (
      Math.abs(currentSteerAngle.current) > 0.01 &&
      (isForward || isBackward || Math.abs(forwardSpeed) > 1.0)
    ) {
      const directionMultiplier = forwardSpeed >= -0.5 ? 1 : -1;
      const turnTorque =
        currentSteerAngle.current * steerSpeed * directionMultiplier;
      rigidBodyRef.current.setAngvel(
        {
          x: rigidBodyRef.current.angvel().x,
          y: turnTorque,
          z: rigidBodyRef.current.angvel().z,
        },
        true
      );
    }

    // ── Lateral Drift Damping ──
    const lateralVel = _currentVel.dot(_rightVec);
    // When holding brake/space, lateral friction drops for epic drifting
    const driftFactor = isBrake ? 0.88 : 0.42;
    _counterForce
      .copy(_rightVec)
      .multiplyScalar(
        -lateralVel * driftFactor * rigidBodyRef.current.mass() * delta * 60
      );
    rigidBodyRef.current.applyImpulse(_counterForce, true);

    // Braking
    if (isBrake) {
      _brakeForce
        .copy(_currentVel)
        .multiplyScalar(-0.65 * rigidBodyRef.current.mass() * delta);
      rigidBodyRef.current.applyImpulse(_brakeForce, true);
    }

    // Stabilize roll & pitch (prevents flipping upside down)
    _euler.setFromQuaternion(_quat, 'YXZ');
    if (Math.abs(_euler.x) > 0.35 || Math.abs(_euler.z) > 0.35) {
      _resetQuat.setFromEuler(_euler.set(0, _euler.y, 0, 'YXZ'));
      rigidBodyRef.current.setRotation(_resetQuat, true);
      rigidBodyRef.current.setAngvel(
        { x: 0, y: rigidBodyRef.current.angvel().y, z: 0 },
        true
      );
    }

    // ── Visual Wheel Steering & Axle Rotation ──
    wheelRotation.current += forwardSpeed * delta * 3.5;

    if (frontLeftWheelRef.current && frontRightWheelRef.current) {
      frontLeftWheelRef.current.rotation.y = currentSteerAngle.current;
      frontRightWheelRef.current.rotation.y = currentSteerAngle.current;
    }

    [
      frontLeftWheelRef,
      frontRightWheelRef,
      rearLeftWheelRef,
      rearRightWheelRef,
    ].forEach((ref) => {
      if (ref.current) {
        const outerGroup = ref.current.children[0];
        if (outerGroup) {
          outerGroup.rotation.x = wheelRotation.current;
        }
      }
    });

    // ── Infinite World Position Wrap Safeguard ──
    const pos = rigidBodyRef.current.translation();
    if (Math.abs(pos.x) > 360 || Math.abs(pos.z) > 360) {
      const newX = Math.abs(pos.x) > 360 ? (pos.x > 0 ? -140 : 140) : pos.x;
      const newZ = Math.abs(pos.z) > 360 ? (pos.z > 0 ? -140 : 140) : pos.z;
      rigidBodyRef.current.setTranslation({ x: newX, y: pos.y, z: pos.z }, true);
    }

    // ── Dynamic 3rd-Person Chase Camera ──
    _carPos.set(pos.x, pos.y, pos.z);

    const camDistance = 8.4 + Math.min(speed * 0.08, 3.2);
    const camHeight = 3.3 + Math.min(speed * 0.04, 1.4);

    _camOffset.set(0, camHeight, camDistance).applyQuaternion(_quat);
    _targetCamPos.copy(_carPos).add(_camOffset);

    state.camera.position.lerp(_targetCamPos, delta * 7.0);

    _lookAtOffset.set(0, 0.9, -3.8).applyQuaternion(_quat);
    _targetLookAt.copy(_carPos).add(_lookAtOffset);

    state.camera.lookAt(_targetLookAt);

    // Dynamic Speed FOV Expansion
    const targetFov = 48 + Math.min(speed * 0.5, 24);
    if (state.camera instanceof THREE.PerspectiveCamera) {
      state.camera.fov = THREE.MathUtils.lerp(
        state.camera.fov,
        targetFov,
        delta * 5.0
      );
      state.camera.updateProjectionMatrix();
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={false}
      mass={1350}
      position={[0, 1.2, 0]}
      linearDamping={0.55}
      angularDamping={2.6}
      friction={0.65}
      restitution={0.12}
      canSleep={false}
    >
      {/* Precision Vehicle Collision Hull */}
      <CuboidCollider args={[0.96, 0.42, 2.15]} position={[0, 0.44, 0]} />

      {/* Aerodynamic Hypercar Body */}
      <HypercarBody
        isAccelerating={isAcceleratingState}
        isBoosting={isBoostingState}
        isBraking={isBrakingState}
      />

      {/* 4 Machined Alloy Wheels with Calipers */}
      <WheelAssembly
        wheelRef={frontLeftWheelRef}
        position={[-0.96, 0.34, -1.28]}
        isFront
      />
      <WheelAssembly
        wheelRef={frontRightWheelRef}
        position={[0.96, 0.34, -1.28]}
        isFront
        isRightSide
      />
      <WheelAssembly
        wheelRef={rearLeftWheelRef}
        position={[-0.98, 0.34, 1.28]}
      />
      <WheelAssembly
        wheelRef={rearRightWheelRef}
        position={[0.98, 0.34, 1.28]}
        isRightSide
      />
    </RigidBody>
  );
}

// ==========================================
// 🛣️ 4. Interactive Smashable Physics Props (Glass, Chrome & Neon)
// ==========================================
function SmashablePhysicsProps() {
  const objects = useMemo(() => {
    const list: SmashableObjectItem[] = [];
    const types: Array<'glassCube' | 'metallicSphere' | 'neonPrism'> = [
      'glassCube',
      'metallicSphere',
      'neonPrism',
    ];

    const coordinates = [
      { x: -7, z: -12 },
      { x: 7, z: -12 },
      { x: -14, z: -22 },
      { x: 14, z: -22 },
      { x: 0, z: -28 },
      { x: -5, z: -38 },
      { x: 5, z: -38 },
      { x: -18, z: -48 },
      { x: 18, z: -48 },
      { x: 0, z: -62 },
      { x: -25, z: -75 },
      { x: 25, z: -75 },
      { x: -12, z: -92 },
      { x: 12, z: -92 },
      { x: 0, z: -108 },
      { x: -28, z: -125 },
      { x: 28, z: -125 },
      { x: -15, z: -145 },
      { x: 15, z: -145 },
      { x: 0, z: -160 },
    ];

    coordinates.forEach((coord, i) => {
      const type = types[i % types.length];
      const scale = 0.85 + (i % 3) * 0.35;
      list.push({
        id: i,
        type,
        position: [coord.x, scale + 0.4, coord.z],
        scale,
      });
    });

    return list;
  }, []);

  return (
    <group>
      {objects.map((obj) => {
        if (obj.type === 'metallicSphere') {
          return (
            <RigidBody
              key={obj.id}
              colliders="ball"
              mass={8}
              restitution={0.8}
              friction={0.3}
              position={obj.position}
            >
              <mesh castShadow receiveShadow>
                <sphereGeometry args={[obj.scale, 32, 32]} />
                <meshStandardMaterial
                  color="#E4E4E7"
                  metalness={0.98}
                  roughness={0.08}
                  envMapIntensity={2.5}
                />
              </mesh>
            </RigidBody>
          );
        }

        if (obj.type === 'glassCube') {
          return (
            <RigidBody
              key={obj.id}
              colliders="cuboid"
              mass={10}
              restitution={0.5}
              friction={0.4}
              position={obj.position}
            >
              <mesh castShadow receiveShadow>
                <boxGeometry
                  args={[obj.scale * 1.5, obj.scale * 1.5, obj.scale * 1.5]}
                />
                <meshPhysicalMaterial
                  color="#0066CC"
                  roughness={0.08}
                  metalness={0.2}
                  transmission={0.8}
                  transparent
                  opacity={0.85}
                />
              </mesh>
            </RigidBody>
          );
        }

        return (
          <RigidBody
            key={obj.id}
            colliders="cuboid"
            mass={6}
            restitution={0.7}
            friction={0.4}
            position={obj.position}
          >
            <mesh castShadow receiveShadow>
              <coneGeometry args={[obj.scale * 1.1, obj.scale * 1.8, 4]} />
              <meshStandardMaterial
                color="#38BDF8"
                emissive="#0284C7"
                emissiveIntensity={2.0}
                roughness={0.2}
                metalness={0.8}
              />
            </mesh>
          </RigidBody>
        );
      })}
    </group>
  );
}

// ==========================================
// 🛣️ 5. Grand Circuit: Stunt Ramps, Turbo Boost Pads & Checkpoint Arches
// ==========================================
function GrandCircuitLand() {
  // Stunt jump ramps
  const ramps = [
    {
      position: [0, 0.6, -24] as [number, number, number],
      rotation: [-0.34, 0, 0] as [number, number, number],
      scale: [6.5, 0.3, 5.5] as [number, number, number],
    },
    {
      position: [-22, 0.55, -50] as [number, number, number],
      rotation: [-0.32, 0.4, 0] as [number, number, number],
      scale: [5.5, 0.28, 4.8] as [number, number, number],
    },
    {
      position: [22, 0.55, -50] as [number, number, number],
      rotation: [-0.32, -0.4, 0] as [number, number, number],
      scale: [5.5, 0.28, 4.8] as [number, number, number],
    },
    {
      position: [0, 0.65, -95] as [number, number, number],
      rotation: [-0.35, 0, 0] as [number, number, number],
      scale: [7.0, 0.35, 6.0] as [number, number, number],
    },
    {
      position: [-32, 0.55, -125] as [number, number, number],
      rotation: [-0.32, 0.35, 0] as [number, number, number],
      scale: [5.5, 0.28, 5.0] as [number, number, number],
    },
    {
      position: [32, 0.55, -125] as [number, number, number],
      rotation: [-0.32, -0.35, 0] as [number, number, number],
      scale: [5.5, 0.28, 5.0] as [number, number, number],
    },
  ];

  // Neon Checkpoint Gateway Arches
  const gateArches = [
    { position: [0, 0, -14] as [number, number, number], title: 'SECTOR 01: LAUNCH' },
    { position: [-22, 0, -36] as [number, number, number], title: 'APEX CURVE WEST' },
    { position: [22, 0, -36] as [number, number, number], title: 'APEX CURVE EAST' },
    { position: [0, 0, -72] as [number, number, number], title: 'MEGA STUNT STRAIGHT' },
    { position: [-32, 0, -110] as [number, number, number], title: 'QUANTUM LOOP' },
    { position: [32, 0, -110] as [number, number, number], title: 'HYPERDRIVE SECTOR' },
  ];

  // Glowing Turbo Boost Pads
  const boostPads = [
    { position: [0, 0.03, -18] as [number, number, number] },
    { position: [-22, 0.03, -42] as [number, number, number] },
    { position: [22, 0.03, -42] as [number, number, number] },
    { position: [0, 0.03, -85] as [number, number, number] },
    { position: [-32, 0.03, -118] as [number, number, number] },
    { position: [32, 0.03, -118] as [number, number, number] },
  ];

  // Architectural Light Pylons / Sky Beacons
  const lightPillars = [
    { position: [-45, 0, -20] as [number, number, number] },
    { position: [45, 0, -20] as [number, number, number] },
    { position: [-50, 0, -65] as [number, number, number] },
    { position: [50, 0, -65] as [number, number, number] },
    { position: [-55, 0, -110] as [number, number, number] },
    { position: [55, 0, -110] as [number, number, number] },
    { position: [-45, 0, -155] as [number, number, number] },
    { position: [45, 0, -155] as [number, number, number] },
  ];

  return (
    <group>
      {/* 🚀 Stunt Jump Ramps */}
      {ramps.map((ramp, i) => (
        <RigidBody
          key={`ramp-${i}`}
          type="fixed"
          friction={0.7}
          position={ramp.position}
          rotation={ramp.rotation}
        >
          <group>
            {/* Main Ramp Surface */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={ramp.scale} />
              <meshStandardMaterial
                color="#09090B"
                roughness={0.25}
                metalness={0.8}
              />
            </mesh>
            {/* Glowing Neon Launch Chevrons on Ramp Face */}
            <mesh position={[0, 0.16, 0]}>
              <boxGeometry args={[ramp.scale[0] * 0.7, 0.02, ramp.scale[2] * 0.6]} />
              <meshStandardMaterial
                color="#0066CC"
                emissive="#0066CC"
                emissiveIntensity={2.5}
                toneMapped={false}
              />
            </mesh>
            {/* Glowing Cyan LED Edge Strips */}
            <mesh position={[-ramp.scale[0] / 2, 0.16, 0]}>
              <boxGeometry args={[0.15, 0.12, ramp.scale[2]]} />
              <meshStandardMaterial
                color="#38BDF8"
                emissive="#38BDF8"
                emissiveIntensity={5.0}
                toneMapped={false}
              />
            </mesh>
            <mesh position={[ramp.scale[0] / 2, 0.16, 0]}>
              <boxGeometry args={[0.15, 0.12, ramp.scale[2]]} />
              <meshStandardMaterial
                color="#38BDF8"
                emissive="#38BDF8"
                emissiveIntensity={5.0}
                toneMapped={false}
              />
            </mesh>
          </group>
        </RigidBody>
      ))}

      {/* ⚡ Glowing Neon Checkpoint Gate Arches */}
      {gateArches.map((gate, i) => (
        <group key={`gate-${i}`} position={gate.position}>
          {/* Left Carbon Structural Pillar */}
          <mesh position={[-5.8, 3.2, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.28, 6.4, 16]} />
            <meshStandardMaterial
              color="#0066CC"
              emissive="#0066CC"
              emissiveIntensity={3.5}
              toneMapped={false}
            />
          </mesh>
          {/* Right Carbon Structural Pillar */}
          <mesh position={[5.8, 3.2, 0]} castShadow>
            <cylinderGeometry args={[0.22, 0.28, 6.4, 16]} />
            <meshStandardMaterial
              color="#0066CC"
              emissive="#0066CC"
              emissiveIntensity={3.5}
              toneMapped={false}
            />
          </mesh>
          {/* Overhead Glowing Truss Gantry */}
          <mesh position={[0, 6.5, 0]} castShadow>
            <boxGeometry args={[12.0, 0.35, 0.4]} />
            <meshStandardMaterial
              color="#38BDF8"
              emissive="#38BDF8"
              emissiveIntensity={4.5}
              toneMapped={false}
            />
          </mesh>
          {/* Overhead Sector Waypoint Spotlight */}
          <pointLight
            position={[0, 6.2, 0]}
            intensity={3.5}
            distance={14}
            color="#38BDF8"
          />
        </group>
      ))}

      {/* 🚀 Turbo Boost Pads (Glow & High-Speed Arrows) */}
      {boostPads.map((pad, i) => (
        <group key={`boost-${i}`} position={pad.position}>
          {/* Pad Base */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[5.5, 7.0]} />
            <meshStandardMaterial
              color="#0284C7"
              emissive="#0284C7"
              emissiveIntensity={1.5}
              roughness={0.3}
            />
          </mesh>
          {/* Animated Glowing Chevrons */}
          {[-1.8, 0, 1.8].map((zOffset, idx) => (
            <mesh
              key={idx}
              position={[0, 0.02, zOffset]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[4.2, 0.6]} />
              <meshStandardMaterial
                color="#38BDF8"
                emissive="#38BDF8"
                emissiveIntensity={7.0}
                toneMapped={false}
              />
            </mesh>
          ))}
          <pointLight
            position={[0, 0.4, 0]}
            intensity={2.5}
            distance={6}
            color="#38BDF8"
          />
        </group>
      ))}

      {/* 💡 Cyber Skyward Light Pylons */}
      {lightPillars.map((pillar, i) => (
        <group key={`pillar-${i}`} position={pillar.position}>
          {/* Base Tower */}
          <mesh position={[0, 4.5, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.35, 9.0, 16]} />
            <meshStandardMaterial
              color="#09090B"
              roughness={0.2}
              metalness={0.9}
            />
          </mesh>
          {/* Radiant Cyan Beacon Orb */}
          <mesh position={[0, 9.4, 0]}>
            <sphereGeometry args={[0.55, 16, 16]} />
            <meshStandardMaterial
              color="#38BDF8"
              emissive="#38BDF8"
              emissiveIntensity={6.0}
              toneMapped={false}
            />
          </mesh>
          {/* Vertical Sky Laser Beam */}
          <mesh position={[0, 30, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 40, 8]} />
            <meshStandardMaterial
              color="#0066CC"
              emissive="#0066CC"
              emissiveIntensity={4.0}
              transparent
              opacity={0.65}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ==========================================
// 🛣️ 6. Infinite Cyber Floor & Grand Racing Track Surface
// ==========================================
function InfiniteFloor() {
  const floorRef = useRef<THREE.Mesh>(null);
  const shadowGroupRef = useRef<THREE.Group>(null);

  // High-resolution procedural racetrack & cyber-grid texture
  const groundTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Dark carbon asphalt base
    ctx.fillStyle = '#070B14';
    ctx.fillRect(0, 0, 1024, 1024);

    // Fine cyber grid lines
    ctx.strokeStyle = 'rgba(0, 102, 204, 0.32)';
    ctx.lineWidth = 2.0;
    const step = 128;
    for (let x = 0; x <= 1024; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    }
    for (let y = 0; y <= 1024; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Glowing Cyan Intersection Nodes
    ctx.fillStyle = '#38BDF8';
    for (let x = 0; x <= 1024; x += step) {
      for (let y = 0; y <= 1024; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Grand Track Road Ribbon (Center Corridor)
    ctx.fillStyle = '#090E1A';
    ctx.fillRect(256, 0, 512, 1024);

    // Track Outer Curb Rumble Strips (Alternating Cyan & White Segments)
    const curbW = 28;
    const segmentH = 64;
    for (let y = 0; y < 1024; y += segmentH) {
      const isCyan = (y / segmentH) % 2 === 0;
      ctx.fillStyle = isCyan ? '#0066CC' : '#38BDF8';
      // Left Curb
      ctx.fillRect(256 - curbW, y, curbW, segmentH);
      // Right Curb
      ctx.fillRect(768, y, curbW, segmentH);
    }

    // Illuminated Center Dashed Line (Amber / Cyan)
    ctx.strokeStyle = '#38BDF8';
    ctx.setLineDash([32, 28]);
    ctx.lineWidth = 5.0;
    ctx.beginPath();
    ctx.moveTo(512, 0);
    ctx.lineTo(512, 1024);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(100, 100);
    return texture;
  }, []);

  useFrame((state) => {
    const camPos = state.camera.position;
    if (floorRef.current) {
      floorRef.current.position.x = camPos.x;
      floorRef.current.position.z = camPos.z;
    }
    if (groundTexture) {
      groundTexture.offset.x = (camPos.x / 14) % 1;
      groundTexture.offset.y = (-camPos.z / 14) % 1;
    }
    if (shadowGroupRef.current) {
      shadowGroupRef.current.position.x = camPos.x;
      shadowGroupRef.current.position.z = camPos.z;
    }
  });

  return (
    <group>
      {/* ♾️ Infinite Physics Collider Ground Floor */}
      <RigidBody type="fixed" friction={0.72} restitution={0.15}>
        <CuboidCollider args={[50000, 0.5, 50000]} position={[0, -0.5, 0]} />
      </RigidBody>

      {/* Dynamic Physical Cyber Floor Plane */}
      <mesh
        ref={floorRef}
        position={[0, -0.01, 0]}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[10000, 10000]} />
        <meshPhysicalMaterial
          map={groundTexture}
          color="#080C16"
          roughness={0.22}
          metalness={0.55}
          clearcoat={1.0}
          clearcoatRoughness={0.12}
          reflectivity={0.85}
        />
      </mesh>

      {/* Soft Contact Shadow under Car & Obstacles */}
      <group ref={shadowGroupRef}>
        <ContactShadows
          position={[0, 0.02, 0]}
          opacity={0.7}
          scale={85}
          blur={1.8}
          far={18}
          color="#000000"
        />
      </group>
    </group>
  );
}

// ==========================================
// 💡 Floating Ambient Cyber Dust for Velocity Perception
// ==========================================
function FloatingCyberParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 400;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const cyan = new THREE.Color('#38BDF8');
    const blue = new THREE.Color('#0066CC');

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 360;
      pos[i * 3 + 1] = 0.2 + Math.random() * 0.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 360;

      const c = Math.random() > 0.5 ? cyan : blue;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, col];
  }, []);

  useFrame((state) => {
    const camPos = state.camera.position;
    if (particlesRef.current) {
      particlesRef.current.position.x = camPos.x;
      particlesRef.current.position.z = camPos.z;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.26}
        vertexColors
        transparent
        opacity={0.65}
        sizeAttenuation
      />
    </points>
  );
}

// ==========================================
// 🏙️ Distant Cyber Metropolis Skyline (Horizon Atmosphere)
// ==========================================
function DistantMetropolis() {
  const buildings = useMemo(() => {
    const list = [];
    const count = 28;
    const radius = 240;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * (radius + Math.random() * 40);
      const z = Math.sin(angle) * (radius + Math.random() * 40);
      const height = 40 + Math.random() * 70;
      const width = 12 + Math.random() * 16;
      list.push({ id: i, position: [x, height / 2, z] as [number, number, number], height, width });
    }
    return list;
  }, []);

  return (
    <group>
      {buildings.map((b) => (
        <group key={b.id} position={b.position}>
          <mesh>
            <boxGeometry args={[b.width, b.height, b.width]} />
            <meshStandardMaterial
              color="#060911"
              roughness={0.7}
              metalness={0.4}
            />
          </mesh>
          {/* Crown Neon Trim */}
          <mesh position={[0, b.height / 2, 0]}>
            <boxGeometry args={[b.width + 0.5, 0.6, b.width + 0.5]} />
            <meshStandardMaterial
              color="#0066CC"
              emissive="#0066CC"
              emissiveIntensity={2.5}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ==========================================
// 🏎️ 7. Main Game Scene Assembly with Studio Lighting & Physics
// ==========================================
function GameScene({
  mobileControls,
  onSpeedUpdate,
  resetTrigger,
  isInView,
  isMobile,
}: VehicleProps & { isMobile: boolean }) {
  return (
    <>
      {/* Seamless Horizon Fog Matched to Midnight Asphalt Floor */}
      <fog attach="fog" args={['#080C16', 45, 340]} />

      {/* Balanced Sky & Ground Ambient Fill Light */}
      <hemisphereLight args={['#1E293B', '#080C16', 0.55]} />

      {/* Soft Directional Overhead Key Light */}
      <directionalLight
        position={[25, 55, 25]}
        intensity={0.65}
        castShadow={!isMobile}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={-0.0005}
      />

      <Environment preset="city" />

      {/* Distant Cyber City Skyline */}
      <DistantMetropolis />

      <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60}>
        {/* Infinite Asphalt Circuit & Floor */}
        <InfiniteFloor />

        {/* Grand Circuit Stunt Ramps, Boost Pads & Gateway Arches */}
        <GrandCircuitLand />

        {/* Smashable Kinetic Physics Props */}
        <SmashablePhysicsProps />

        {/* Driveable 3D Hypercar with Physics */}
        <ArcadeVehicle
          mobileControls={mobileControls}
          onSpeedUpdate={onSpeedUpdate}
          resetTrigger={resetTrigger}
          isInView={isInView}
        />
      </Physics>

      {/* Floating Velocity Dust */}
      <FloatingCyberParticles />

      {/* Post-Processing Bloom & Vignette for Cyber Glow */}
      {!isMobile && (
        <EffectComposer>
          <Bloom
            intensity={1.25}
            luminanceThreshold={0.52}
            luminanceSmoothing={0.85}
          />
          <Vignette offset={0.32} darkness={0.42} />
        </EffectComposer>
      )}
    </>
  );
}

// ==========================================
// 💡 360-Degree Touch Joystick for Mobile
// ==========================================
interface TouchJoystickProps {
  onMove: (controls: Partial<MobileControlsState>) => void;
}

function TouchJoystick({ onMove }: TouchJoystickProps) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const maxRadius = 45;

  useEffect(() => {
    const elem = joystickRef.current;
    if (!elem) return;

    const preventDefaultScroll = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    elem.addEventListener('touchstart', preventDefaultScroll, { passive: false });
    elem.addEventListener('touchmove', preventDefaultScroll, { passive: false });

    return () => {
      elem.removeEventListener('touchstart', preventDefaultScroll);
      elem.removeEventListener('touchmove', preventDefaultScroll);
    };
  }, []);

  const handleTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!joystickRef.current || e.touches.length === 0) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const touch = e.touches[0];
    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;

    const distance = Math.min(maxRadius, Math.hypot(dx, dy));
    const angle = Math.atan2(dy, dx);

    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;

    setKnobPos({ x, y });
    setActive(true);

    const normX = x / maxRadius;
    const normY = y / maxRadius;

    onMove({
      left: normX < -0.25,
      right: normX > 0.25,
      forward: normY < -0.25,
      backward: normY > 0.25,
    });
  };

  const handleTouchEnd = () => {
    setKnobPos({ x: 0, y: 0 });
    setActive(false);
    onMove({ left: false, right: false, forward: false, backward: false });
  };

  return (
    <div
      ref={joystickRef}
      onTouchStart={handleTouch}
      onTouchMove={handleTouch}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={`relative w-28 h-28 rounded-full bg-white/55 backdrop-blur-md border ${
        active
          ? 'border-[#0066CC] bg-white/75 shadow-lg scale-105'
          : 'border-black/15 shadow-md'
      } transition-transform flex items-center justify-center touch-none select-none cursor-pointer`}
    >
      <div className="w-16 h-16 rounded-full border border-black/10 pointer-events-none" />
      <div
        className="absolute w-12 h-12 rounded-full bg-[#09090B] text-white shadow-lg flex items-center justify-center pointer-events-none"
        style={{
          transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
        }}
      >
        <div className="w-3.5 h-3.5 rounded-full bg-[#38BDF8] animate-pulse" />
      </div>
    </div>
  );
}

// ==========================================
// 🏎️ 8. Exported Interactive Hero Car Component
// ==========================================
export default function InteractiveHeroCar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [speedKmh, setSpeedKmh] = useState(0);
  const [isBoosting, setIsBoosting] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);

  // Mobile Touch Control state
  const [mobileControls, setMobileControls] = useState<MobileControlsState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
    boost: false,
  });

  // IntersectionObserver for GPU Throttling
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Viewport detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth < 768 ||
          /Android|iPhone|iPad/i.test(navigator.userAgent)
      );
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keyboard scroll lock prevention
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const driveKeys = [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Space',
        'KeyW',
        'KeyS',
        'KeyA',
        'KeyD',
        'ShiftLeft',
        'ShiftRight',
        'KeyE',
      ];

      if (driveKeys.includes(e.code) || driveKeys.includes(e.key)) {
        const activeElem = document.activeElement as HTMLElement | null;
        const isInputElement =
          activeElem &&
          (activeElem.tagName === 'INPUT' ||
            activeElem.tagName === 'TEXTAREA' ||
            activeElem.isContentEditable);

        if (!isInputElement && isInView) {
          e.preventDefault();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInView]);

  const handleJoystickMove = (partialControls: Partial<MobileControlsState>) => {
    setMobileControls((prev) => ({ ...prev, ...partialControls }));
  };

  const handleSpeedUpdate = (speed: number, boosting: boolean) => {
    setSpeedKmh(speed);
    setIsBoosting(boosting);
  };

  // Gear Calculation based on speed
  const currentGear = useMemo(() => {
    if (isBoosting) return 'NITRO';
    if (speedKmh <= 0) return 'N';
    if (speedKmh < 30) return '1';
    if (speedKmh < 65) return '2';
    if (speedKmh < 100) return '3';
    if (speedKmh < 135) return '4';
    if (speedKmh < 170) return '5';
    return '6';
  }, [speedKmh, isBoosting]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none pointer-events-auto"
    >
      {/* 3D WebGL Canvas Layer */}
      <KeyboardControls map={keyboardMap}>
        <Canvas
          shadows={!isMobile}
          camera={{ position: [0, 3.6, 8.8], fov: 50 }}
          className="w-full h-full bg-[#080C16]"
          dpr={isMobile ? [1, 1] : [1, 1.5]}
          frameloop={isInView ? 'always' : 'never'}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
          }}
        >
          <GameScene
            mobileControls={mobileControls}
            onSpeedUpdate={handleSpeedUpdate}
            resetTrigger={resetTrigger}
            isInView={isInView}
            isMobile={isMobile}
          />
        </Canvas>
      </KeyboardControls>

      {/* ── Racing Telemetry HUD Overlay ── */}
      <div className="absolute top-24 right-4 md:right-8 z-20 pointer-events-auto flex items-center gap-2.5">
        {/* Speedometer & Gear Badge */}
        <div className="flex items-center gap-3 px-3.5 py-1.5 bg-white/85 backdrop-blur-md border border-black/[0.08] rounded-full shadow-xs">
          <div className="flex items-center gap-1.5">
            {isBoosting ? (
              <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-[#0066CC] animate-pulse" />
            )}
            <span className="font-mono text-xs font-bold text-[#09090B]">
              {speedKmh}{' '}
              <span className="text-[10px] text-[#71717A] font-normal">KM/H</span>
            </span>
          </div>

          <div className="h-3 w-px bg-black/15" />

          {/* Gear Indicator */}
          <div className="flex items-center gap-1 font-mono text-[10px] font-bold">
            <span className="text-[#71717A]">GEAR</span>
            <span
              className={
                currentGear === 'NITRO'
                  ? 'text-orange-500 font-extrabold animate-pulse'
                  : 'text-[#0066CC]'
              }
            >
              {currentGear}
            </span>
          </div>
        </div>

        {/* Reset Car Button */}
        <button
          onClick={() => setResetTrigger((prev) => prev + 1)}
          className="p-2 bg-white/85 backdrop-blur-md border border-black/[0.08] hover:bg-white text-[#09090B] rounded-full shadow-xs transition-all hover:scale-105 active:scale-95 touch-target cursor-pointer"
          title="Reset Car Position (R)"
          aria-label="Reset Car"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#71717A]" />
        </button>
      </div>

      {/* ── On-Screen Driving Controls Guide (Desktop) ── */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none hidden md:flex items-center gap-2 font-mono text-[11px] text-[#71717A] bg-white/85 backdrop-blur-md border border-black/[0.08] px-4 py-2 rounded-full shadow-2xs">
        <span className="px-1.5 py-0.5 bg-[#F2F2F7] rounded text-[#09090B] font-semibold">
          WASD
        </span>
        <span>/</span>
        <span className="px-1.5 py-0.5 bg-[#F2F2F7] rounded text-[#09090B] font-semibold">
          ARROWS
        </span>
        <span>DRIVE</span>
        <span className="mx-1">•</span>
        <span className="px-1.5 py-0.5 bg-[#F2F2F7] rounded text-[#09090B] font-semibold">
          SHIFT
        </span>
        <span className="text-orange-600 font-semibold">NITRO</span>
        <span className="mx-1">•</span>
        <span className="px-1.5 py-0.5 bg-[#F2F2F7] rounded text-[#09090B] font-semibold">
          SPACE
        </span>
        <span>DRIFT</span>
        <span className="mx-1">•</span>
        <span className="px-1.5 py-0.5 bg-[#F2F2F7] rounded text-[#09090B] font-semibold">
          R
        </span>
        <span>RESET</span>
      </div>

      {/* ── Mobile View Controls: 360° Touch Joystick + Action Buttons ── */}
      <div className="absolute bottom-6 left-4 right-4 z-20 pointer-events-auto flex md:hidden items-end justify-between select-none">
        {/* Joystick on left */}
        <TouchJoystick onMove={handleJoystickMove} />

        {/* Action Buttons on right */}
        <div className="flex flex-col gap-2">
          {/* Nitro Boost Button */}
          <button
            onTouchStart={() =>
              setMobileControls((prev) => ({ ...prev, boost: true }))
            }
            onTouchEnd={() =>
              setMobileControls((prev) => ({ ...prev, boost: false }))
            }
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center font-mono text-[10px] font-bold shadow-md transition-transform ${
              mobileControls.boost
                ? 'bg-orange-500 text-white scale-95'
                : 'bg-white/80 backdrop-blur-md text-[#09090B] border border-black/10'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-500" />
            <span>NITRO</span>
          </button>

          {/* Drift / Brake Button */}
          <button
            onTouchStart={() =>
              setMobileControls((prev) => ({ ...prev, brake: true }))
            }
            onTouchEnd={() =>
              setMobileControls((prev) => ({ ...prev, brake: false }))
            }
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center font-mono text-[10px] font-bold shadow-md transition-transform ${
              mobileControls.brake
                ? 'bg-red-500 text-white scale-95'
                : 'bg-white/80 backdrop-blur-md text-[#09090B] border border-black/10'
            }`}
          >
            <Gauge className="w-4 h-4 text-[#0066CC]" />
            <span>DRIFT</span>
          </button>
        </div>
      </div>
    </div>
  );
}
