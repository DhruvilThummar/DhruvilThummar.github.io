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
import { RefreshCw, Zap } from 'lucide-react';

// Keyboard control enum mapping
export enum ControlKeys {
  forward = 'forward',
  backward = 'backward',
  left = 'left',
  right = 'right',
  brake = 'brake',
  reset = 'reset',
}

const keyboardMap = [
  { name: ControlKeys.forward, keys: ['KeyW', 'ArrowUp'] },
  { name: ControlKeys.backward, keys: ['KeyS', 'ArrowDown'] },
  { name: ControlKeys.left, keys: ['KeyA', 'ArrowLeft'] },
  { name: ControlKeys.right, keys: ['KeyD', 'ArrowRight'] },
  { name: ControlKeys.brake, keys: ['Space'] },
  { name: ControlKeys.reset, keys: ['KeyR'] },
];

export interface MobileControlsState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  brake: boolean;
}

interface VehicleProps {
  mobileControls: MobileControlsState;
  onSpeedUpdate: (speedKmh: number) => void;
  resetTrigger: number;
  isInView: boolean;
}

interface SmashableObjectItem {
  id: number;
  type: 'glassCube' | 'metallicSphere' | 'neonPrism';
  position: [number, number, number];
  scale: number;
}

// 💡 Zero-GC Static Vector Singletons to eliminate JavaScript Garbage Collection micro-lag during 60FPS physics loops
const _quat = new THREE.Quaternion();
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _resetQuat = new THREE.Quaternion();
const _forwardVec = new THREE.Vector3();
const _rightVec = new THREE.Vector3();
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
// 1. Sleek Jet Black Sports Car & Raycast Arcade Vehicle Engine
// ==========================================
function ArcadeVehicle({ mobileControls, onSpeedUpdate, resetTrigger, isInView }: VehicleProps) {
  const rigidBodyRef = useRef<RapierRigidBody>(null);

  // Wheel visual refs for steering & rotational movement
  const frontLeftWheelRef = useRef<THREE.Group>(null);
  const frontRightWheelRef = useRef<THREE.Group>(null);
  const rearLeftWheelRef = useRef<THREE.Group>(null);
  const rearRightWheelRef = useRef<THREE.Group>(null);

  const [, getKeys] = useKeyboardControls<ControlKeys>();

  // Current steering angle & wheel rotation angle tracking
  const currentSteerAngle = useRef(0);
  const wheelRotation = useRef(0);

  // Handle explicit reset from parent or keypress
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
    // 💡 GPU Safeguard: Completely skip physics & matrix updates when off-screen
    if (!isInView || !rigidBodyRef.current) return;

    const keys = getKeys();
    const isForward = keys.forward || mobileControls.forward;
    const isBackward = keys.backward || mobileControls.backward;
    const isLeft = keys.left || mobileControls.left;
    const isRight = keys.right || mobileControls.right;
    const isBrake = keys.brake || mobileControls.brake;
    const isReset = keys.reset;

    if (isReset) {
      handleReset();
    }

    // Vehicle orientation & linear velocity
    const linvel = rigidBodyRef.current.linvel();
    const rot = rigidBodyRef.current.rotation();
    _quat.set(rot.x, rot.y, rot.z, rot.w);

    // Direction vectors
    _forwardVec.set(0, 0, -1).applyQuaternion(_quat);
    _rightVec.set(1, 0, 0).applyQuaternion(_quat);

    // Current speeds
    _currentVel.set(linvel.x, linvel.y, linvel.z);
    const speed = _currentVel.length();
    const forwardSpeed = _currentVel.dot(_forwardVec);
    const speedKmh = Math.round(speed * 3.6);
    onSpeedUpdate(speedKmh);

    // ------------------------------------------
    // A. Driving Dynamics & Acceleration Tuning
    // ------------------------------------------
    const acceleration = 46.0;
    const reverseAccel = 25.0;
    const maxSpeed = 42.0;
    const steerSpeed = 2.6;

    // Apply forward/backward propulsion
    if (isForward && forwardSpeed < maxSpeed) {
      _impulseForce.copy(_forwardVec).multiplyScalar(acceleration * rigidBodyRef.current.mass() * delta);
      rigidBodyRef.current.applyImpulse(_impulseForce, true);
    } else if (isBackward && forwardSpeed > -maxSpeed * 0.4) {
      _impulseForce.copy(_forwardVec).multiplyScalar(-reverseAccel * rigidBodyRef.current.mass() * delta);
      rigidBodyRef.current.applyImpulse(_impulseForce, true);
    }

    // ------------------------------------------
    // B. Steering & Drifting Torque
    // ------------------------------------------
    let targetSteer = 0;
    if (isLeft) targetSteer += 1;
    if (isRight) targetSteer -= 1;

    // Smooth steering input lerp
    currentSteerAngle.current = THREE.MathUtils.lerp(
      currentSteerAngle.current,
      targetSteer * 0.45,
      delta * 12.0
    );

    if (Math.abs(currentSteerAngle.current) > 0.01 && (isForward || isBackward || Math.abs(forwardSpeed) > 1.0)) {
      const directionMultiplier = forwardSpeed >= -0.5 ? 1 : -1;
      const turnTorque = currentSteerAngle.current * steerSpeed * directionMultiplier;
      rigidBodyRef.current.setAngvel(
        { x: rigidBodyRef.current.angvel().x, y: turnTorque, z: rigidBodyRef.current.angvel().z },
        true
      );
    }

    // ------------------------------------------
    // C. Lateral Drift Damping
    // ------------------------------------------
    const lateralVel = _currentVel.dot(_rightVec);
    const driftFactor = isBrake ? 0.85 : 0.45;
    _counterForce.copy(_rightVec).multiplyScalar(-lateralVel * driftFactor * rigidBodyRef.current.mass() * delta * 60);
    rigidBodyRef.current.applyImpulse(_counterForce, true);

    // Braking
    if (isBrake) {
      _brakeForce.copy(_currentVel).multiplyScalar(-0.6 * rigidBodyRef.current.mass() * delta);
      rigidBodyRef.current.applyImpulse(_brakeForce, true);
    }

    // Stabilize roll & pitch to prevent flipping upside down
    _euler.setFromQuaternion(_quat, 'YXZ');
    if (Math.abs(_euler.x) > 0.35 || Math.abs(_euler.z) > 0.35) {
      _resetQuat.setFromEuler(_euler.set(0, _euler.y, 0, 'YXZ'));
      rigidBodyRef.current.setRotation(_resetQuat, true);
      rigidBodyRef.current.setAngvel({ x: 0, y: rigidBodyRef.current.angvel().y, z: 0 }, true);
    }

    // ------------------------------------------
    // D. Visual Wheel Steering & Axle Rotation
    // ------------------------------------------
    wheelRotation.current += forwardSpeed * delta * 3.5;

    if (frontLeftWheelRef.current && frontRightWheelRef.current) {
      frontLeftWheelRef.current.rotation.y = currentSteerAngle.current;
      frontRightWheelRef.current.rotation.y = currentSteerAngle.current;
    }

    [frontLeftWheelRef, frontRightWheelRef, rearLeftWheelRef, rearRightWheelRef].forEach((ref) => {
      if (ref.current) {
        const wheelMesh = ref.current.children[0];
        if (wheelMesh) {
          wheelMesh.rotation.x = wheelRotation.current;
        }
      }
    });

    // ------------------------------------------
    // E. Infinite World Position Wrap Safeguard
    // ------------------------------------------
    const pos = rigidBodyRef.current.translation();
    if (Math.abs(pos.x) > 350 || Math.abs(pos.z) > 350) {
      const newX = Math.abs(pos.x) > 350 ? (pos.x > 0 ? -120 : 120) : pos.x;
      const newZ = Math.abs(pos.z) > 350 ? (pos.z > 0 ? -120 : 120) : pos.z;
      rigidBodyRef.current.setTranslation({ x: newX, y: pos.y, z: pos.z }, true);
    }

    // ------------------------------------------
    // F. Cinematic Chase Camera System
    // ------------------------------------------
    _carPos.set(pos.x, pos.y, pos.z);

    // Dynamic offset behind car
    const camDistance = 8.2 + Math.min(speed * 0.08, 2.5);
    const camHeight = 3.2 + Math.min(speed * 0.04, 1.2);

    _camOffset.set(0, camHeight, camDistance).applyQuaternion(_quat);
    _targetCamPos.copy(_carPos).add(_camOffset);

    state.camera.position.lerp(_targetCamPos, delta * 6.5);

    _lookAtOffset.set(0, 0.8, -3.5).applyQuaternion(_quat);
    _targetLookAt.copy(_carPos).add(_lookAtOffset);

    state.camera.lookAt(_targetLookAt);

    // Dynamic Speed FOV Expansion
    const targetFov = 48 + Math.min(speed * 0.45, 18);
    if (state.camera instanceof THREE.PerspectiveCamera) {
      state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, targetFov, delta * 4.0);
      state.camera.updateProjectionMatrix();
    }
  });

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={false}
      mass={1400}
      position={[0, 1.2, 0]}
      linearDamping={0.6}
      angularDamping={2.5}
      friction={0.6}
      restitution={0.1}
      canSleep={false}
    >
      <CuboidCollider args={[0.95, 0.45, 2.1]} position={[0, 0.45, 0]} />

      {/* Sleek Minimalist Jet Black Sports Car Body */}
      <group position={[0, 0, 0]}>
        {/* Main Aerodynamic Chassis */}
        <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.85, 0.45, 4.1]} />
          <meshPhysicalMaterial
            color="#09090B"
            roughness={0.08}
            metalness={0.92}
            clearcoat={1.0}
            clearcoatRoughness={0.04}
            envMapIntensity={2.5}
          />
        </mesh>

        {/* Lower Front Splitter / Side Skirts */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[1.92, 0.15, 4.2]} />
          <meshStandardMaterial color="#18181B" roughness={0.2} metalness={0.95} />
        </mesh>

        {/* Fastback Cabin & Tinted Glass Cockpit */}
        <mesh position={[0, 0.72, -0.2]} castShadow>
          <boxGeometry args={[1.45, 0.42, 2.2]} />
          <meshPhysicalMaterial
            color="#09090B"
            roughness={0.05}
            metalness={0.95}
            transmission={0.5}
            transparent
            opacity={0.95}
          />
        </mesh>

        {/* Front Headlight LED Lightstrips (Hyper-Bright Cyan Bloom) */}
        <mesh position={[-0.7, 0.42, -2.06]}>
          <boxGeometry args={[0.38, 0.09, 0.08]} />
          <meshStandardMaterial
            color="#60A5FA"
            emissive="#60A5FA"
            emissiveIntensity={8.0}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0.7, 0.42, -2.06]}>
          <boxGeometry args={[0.38, 0.09, 0.08]} />
          <meshStandardMaterial
            color="#60A5FA"
            emissive="#60A5FA"
            emissiveIntensity={2.5}
            toneMapped={false}
          />
        </mesh>

        {/* Dynamic Soft Forward Headlight LED Accents */}
        <pointLight position={[-0.7, 0.45, -2.2]} intensity={1.5} distance={8} color="#60A5FA" />
        <pointLight position={[0.7, 0.45, -2.2]} intensity={1.5} distance={8} color="#60A5FA" />

        {/* Rear Taillight Continuous LED Bar */}
        <mesh position={[0, 0.46, 2.06]}>
          <boxGeometry args={[1.75, 0.09, 0.08]} />
          <meshStandardMaterial
            color="#EF4444"
            emissive="#EF4444"
            emissiveIntensity={3.5}
            toneMapped={false}
          />
        </mesh>

        {/* Dynamic Rear Taillight Road Illumination */}
        <pointLight position={[0, 0.46, 2.3]} intensity={2.5} distance={8} color="#EF4444" />

        {/* Futuristic Cyber Neon Chassis Underglow */}
        <pointLight position={[0, 0.15, 0]} intensity={2.5} distance={5} color="#0066CC" />

        {/* Rear Aerodynamic GT Wing / Spoiler */}
        <group position={[0, 0.82, 1.85]}>
          <mesh position={[0, 0.1, 0]} castShadow>
            <boxGeometry args={[1.8, 0.05, 0.35]} />
            <meshStandardMaterial color="#09090B" roughness={0.15} metalness={0.85} />
          </mesh>
          <mesh position={[-0.65, -0.05, 0]}>
            <boxGeometry args={[0.06, 0.25, 0.2]} />
            <meshStandardMaterial color="#18181B" />
          </mesh>
          <mesh position={[0.65, -0.05, 0]}>
            <boxGeometry args={[0.06, 0.25, 0.2]} />
            <meshStandardMaterial color="#18181B" />
          </mesh>
        </group>

        {/* Wheel Assembly Groups (FL, FR, RL, RR) */}
        {/* Front Left */}
        <group ref={frontLeftWheelRef} position={[-0.95, 0.32, -1.25]}>
          <group>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.32, 0.32, 0.26, 24]} />
              <meshStandardMaterial color="#09090B" roughness={0.6} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.2, 0.27, 16]} />
              <meshStandardMaterial color="#71717A" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        </group>

        {/* Front Right */}
        <group ref={frontRightWheelRef} position={[0.95, 0.32, -1.25]}>
          <group>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.32, 0.32, 0.26, 24]} />
              <meshStandardMaterial color="#09090B" roughness={0.6} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.2, 0.27, 16]} />
              <meshStandardMaterial color="#71717A" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        </group>

        {/* Rear Left */}
        <group ref={rearLeftWheelRef} position={[-0.95, 0.32, 1.25]}>
          <group>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.34, 0.34, 0.28, 24]} />
              <meshStandardMaterial color="#09090B" roughness={0.6} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.21, 0.21, 0.29, 16]} />
              <meshStandardMaterial color="#71717A" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        </group>

        {/* Rear Right */}
        <group ref={rearRightWheelRef} position={[0.95, 0.32, 1.25]}>
          <group>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.34, 0.34, 0.28, 24]} />
              <meshStandardMaterial color="#09090B" roughness={0.6} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.21, 0.21, 0.29, 16]} />
              <meshStandardMaterial color="#71717A" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        </group>
      </group>
    </RigidBody>
  );
}

// ==========================================
// 2. Smashable Interactive Geometric RigidBodies
// ==========================================
function SmashableObjects() {
  const objects = useMemo(() => {
    const list: SmashableObjectItem[] = [];
    const types: Array<'glassCube' | 'metallicSphere' | 'neonPrism'> = [
      'glassCube',
      'metallicSphere',
      'neonPrism',
    ];

    const coordinates = [
      { x: -6, z: -10 },
      { x: 6, z: -10 },
      { x: -12, z: -18 },
      { x: 12, z: -18 },
      { x: -4, z: -25 },
      { x: 4, z: -25 },
      { x: -15, z: -8 },
      { x: 15, z: -8 },
      { x: -8, z: -32 },
      { x: 8, z: -32 },
      { x: 0, z: -20 },
      { x: -18, z: -28 },
      { x: 18, z: -28 },
      { x: -25, z: -45 },
      { x: 25, z: -45 },
      { x: -10, z: -55 },
      { x: 10, z: -55 },
      { x: 0, z: -60 },
      { x: -30, z: -75 },
      { x: 30, z: -75 },
      { x: -15, z: -85 },
      { x: 15, z: -85 },
      { x: 0, z: -95 },
      { x: -40, z: -105 },
      { x: 40, z: -105 },
      { x: -20, z: -120 },
      { x: 20, z: -120 },
      { x: 0, z: -135 },
      { x: -35, z: -150 },
      { x: 35, z: -150 },
    ];

    coordinates.forEach((coord, i) => {
      const type = types[i % types.length];
      const scale = 0.8 + (i % 4) * 0.35;
      list.push({ id: i, type, position: [coord.x, scale + 0.5, coord.z] as [number, number, number], scale });
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
              mass={6}
              restitution={0.8}
              friction={0.3}
              position={obj.position}
            >
              <mesh castShadow receiveShadow>
                <sphereGeometry args={[obj.scale, 32, 32]} />
                <meshStandardMaterial
                  color="#D4D4D8"
                  metalness={0.95}
                  roughness={0.1}
                  envMapIntensity={2.0}
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
              mass={8}
              restitution={0.5}
              friction={0.4}
              position={obj.position}
            >
              <mesh castShadow receiveShadow>
                <boxGeometry args={[obj.scale * 1.6, obj.scale * 1.6, obj.scale * 1.6]} />
                <meshPhysicalMaterial
                  color="#0066CC"
                  roughness={0.1}
                  metalness={0.2}
                  transmission={0.75}
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
            mass={5}
            restitution={0.7}
            friction={0.4}
            position={obj.position}
          >
            <mesh castShadow receiveShadow>
              <coneGeometry args={[obj.scale * 1.2, obj.scale * 1.8, 4]} />
              <meshStandardMaterial
                color="#38BDF8"
                emissive="#0284C7"
                emissiveIntensity={1.5}
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
// 🚀 Stunt Jump Ramps & Cyber Checkpoint Gates (Mega Arena)
// ==========================================
function ArenaTrackFeatures() {
  const ramps = [
    { position: [0, 0.55, -22] as [number, number, number], rotation: [-0.35, 0, 0] as [number, number, number], scale: [6.0, 0.3, 5.0] },
    { position: [-22, 0.5, -45] as [number, number, number], rotation: [-0.32, 0.4, 0] as [number, number, number], scale: [5.0, 0.25, 4.5] },
    { position: [22, 0.5, -45] as [number, number, number], rotation: [-0.32, -0.4, 0] as [number, number, number], scale: [5.0, 0.25, 4.5] },
    { position: [0, 0.55, -80] as [number, number, number], rotation: [-0.35, 0, 0] as [number, number, number], scale: [6.5, 0.3, 5.5] },
    { position: [-30, 0.5, -110] as [number, number, number], rotation: [-0.32, 0.3, 0] as [number, number, number], scale: [5.0, 0.25, 4.5] },
    { position: [30, 0.5, -110] as [number, number, number], rotation: [-0.32, -0.3, 0] as [number, number, number], scale: [5.0, 0.25, 4.5] },
  ];

  const gateArches = [
    { position: [0, 0, -12] as [number, number, number] },
    { position: [-22, 0, -32] as [number, number, number] },
    { position: [22, 0, -32] as [number, number, number] },
    { position: [0, 0, -60] as [number, number, number] },
    { position: [-30, 0, -95] as [number, number, number] },
    { position: [30, 0, -95] as [number, number, number] },
  ];

  const lightPillars = [
    { position: [-50, 0, -20] as [number, number, number] },
    { position: [50, 0, -20] as [number, number, number] },
    { position: [-50, 0, -60] as [number, number, number] },
    { position: [50, 0, -60] as [number, number, number] },
    { position: [-50, 0, -100] as [number, number, number] },
    { position: [50, 0, -100] as [number, number, number] },
    { position: [-50, 0, -140] as [number, number, number] },
    { position: [50, 0, -140] as [number, number, number] },
  ];

  return (
    <group>
      {/* 🚀 Stunt Jump Ramps */}
      {ramps.map((ramp, i) => (
        <RigidBody key={`ramp-${i}`} type="fixed" friction={0.6} position={ramp.position} rotation={ramp.rotation}>
          <group>
            {/* Main Ramp Surface */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={ramp.scale as [number, number, number]} />
              <meshStandardMaterial color="#09090B" roughness={0.2} metalness={0.8} />
            </mesh>
            {/* Glowing Cyan LED Edge Strips */}
            <mesh position={[-ramp.scale[0] / 2, 0.15, 0]}>
              <boxGeometry args={[0.12, 0.1, ramp.scale[2]]} />
              <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={4.0} toneMapped={false} />
            </mesh>
            <mesh position={[ramp.scale[0] / 2, 0.15, 0]}>
              <boxGeometry args={[0.12, 0.1, ramp.scale[2]]} />
              <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={4.0} toneMapped={false} />
            </mesh>
          </group>
        </RigidBody>
      ))}

      {/* ⚡ Glowing Neon Checkpoint Gate Arches */}
      {gateArches.map((gate, i) => (
        <group key={`gate-${i}`} position={gate.position}>
          {/* Left Pillar */}
          <mesh position={[-5.0, 3.0, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 6.0, 16]} />
            <meshStandardMaterial color="#0066CC" emissive="#0066CC" emissiveIntensity={3.0} toneMapped={false} />
          </mesh>
          {/* Right Pillar */}
          <mesh position={[5.0, 3.0, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 6.0, 16]} />
            <meshStandardMaterial color="#0066CC" emissive="#0066CC" emissiveIntensity={3.0} toneMapped={false} />
          </mesh>
          {/* Top Crossbar */}
          <mesh position={[0, 6.0, 0]} castShadow>
            <boxGeometry args={[10.2, 0.25, 0.25]} />
            <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={4.0} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* 💡 Cyber Perimeter Light Pillars */}
      {lightPillars.map((pillar, i) => (
        <group key={`pillar-${i}`} position={pillar.position}>
          <mesh position={[0, 4.0, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, 8.0, 16]} />
            <meshStandardMaterial color="#09090B" roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh position={[0, 8.2, 0]}>
            <sphereGeometry args={[0.45, 16, 16]} />
            <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={5.0} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ==========================================
// ==========================================
// ==========================================
// 💡 Floating Ground Cyber Particles for 3D Velocity Perception
// ==========================================
function GroundCyberParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 350;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const cyan = new THREE.Color('#38BDF8');
    const blue = new THREE.Color('#0066CC');

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 350;
      pos[i * 3 + 1] = 0.15 + Math.random() * 0.45;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 350;

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
        size={0.28}
        vertexColors
        transparent
        opacity={0.65}
        sizeAttenuation
      />
    </points>
  );
}

// ==========================================
// Dynamic Truly Infinite Mega Cyber Floor Component
// ==========================================
function InfiniteFloor() {
  const floorRef = useRef<THREE.Mesh>(null);
  const shadowGroupRef = useRef<THREE.Group>(null);

  // Generate high-resolution procedural hex-grid & racing asphalt texture
  const groundTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Dark carbon asphalt base
    ctx.fillStyle = '#060A12';
    ctx.fillRect(0, 0, 512, 512);

    // Fine cyber grid lines
    ctx.strokeStyle = 'rgba(0, 102, 204, 0.28)';
    ctx.lineWidth = 1.8;
    const step = 64;
    for (let x = 0; x <= 512; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Hexagonal / Diamond Micro-Circuit Accents inside grid cells
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    ctx.lineWidth = 1;
    for (let x = 32; x < 512; x += step) {
      for (let y = 32; y < 512; y += step) {
        ctx.beginPath();
        ctx.moveTo(x, y - 12);
        ctx.lineTo(x + 12, y);
        ctx.lineTo(x, y + 12);
        ctx.lineTo(x - 12, y);
        ctx.closePath();
        ctx.stroke();
      }
    }

    // Glowing cyan intersection nodes
    ctx.fillStyle = '#38BDF8';
    for (let x = 0; x <= 512; x += step) {
      for (let y = 0; y <= 512; y += step) {
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Glowing amber center lane dash markings
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.setLineDash([16, 16]);
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(256, 0);
    ctx.lineTo(256, 512);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(160, 160);
    return texture;
  }, []);

  useFrame((state) => {
    const camPos = state.camera.position;
    if (floorRef.current) {
      floorRef.current.position.x = camPos.x;
      floorRef.current.position.z = camPos.z;
    }
    if (groundTexture) {
      // Truly Infinite Texture Offset Scrolling in all 360 degrees
      groundTexture.offset.x = (camPos.x / 10) % 1;
      groundTexture.offset.y = (-camPos.z / 10) % 1;
    }
    if (shadowGroupRef.current) {
      shadowGroupRef.current.position.x = camPos.x;
      shadowGroupRef.current.position.z = camPos.z;
    }
  });

  return (
    <group>
      {/* ♾️ Truly Infinite 100,000m x 100,000m Physics Collider Floor */}
      <RigidBody type="fixed" friction={0.7} restitution={0.2}>
        <CuboidCollider args={[50000, 0.5, 50000]} position={[0, -0.5, 0]} />
      </RigidBody>

      {/* Dynamic Physical Cyber Floor Plane with Clearcoat Specular Reflections */}
      <mesh ref={floorRef} position={[0, -0.01, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10000, 10000]} />
        <meshPhysicalMaterial
          map={groundTexture}
          color="#0B0F19"
          roughness={0.2}
          metalness={0.6}
          clearcoat={1.0}
          clearcoatRoughness={0.15}
          reflectivity={0.8}
        />
      </mesh>

      {/* Dynamic Contact Shadow Following Camera & Car Everywhere */}
      <group ref={shadowGroupRef}>
        <ContactShadows
          position={[0, 0.02, 0]}
          opacity={0.65}
          scale={80}
          blur={2.0}
          far={15}
          color="#000000"
        />
      </group>

      {/* 🌟 Floating Ground Cyber Particles for 3D Velocity Perception */}
      <GroundCyberParticles />
    </group>
  );
}

// ==========================================
// 3. Main Scene Setup with Soft Studio Lighting
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
      {/* 💡 Atmospheric Depth Fog Matched to Dark Land Floor */}
      <fog attach="fog" args={['#0F172A', 40, 350]} />

      {/* 💡 Balanced Ambient Fill Light */}
      <hemisphereLight args={['#1E293B', '#0F172A', 0.4]} />

      {/* Soft Directional Overhead Key Light */}
      <directionalLight
        position={[20, 45, 20]}
        intensity={0.5}
        castShadow={!isMobile}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-35}
        shadow-camera-right={35}
        shadow-camera-top={35}
        shadow-camera-bottom={-35}
        shadow-bias={-0.0005}
      />

      <Environment preset="city" />

      <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60}>
        {/* Dynamic Infinite Floor & Grid */}
        <InfiniteFloor />

        {/* Driveable Raycast Arcade Vehicle */}
        <ArcadeVehicle
          mobileControls={mobileControls}
          onSpeedUpdate={onSpeedUpdate}
          resetTrigger={resetTrigger}
          isInView={isInView}
        />
      </Physics>

      {/* 💡 Adaptive Mobile Tiering: Skip Post-Processing on Mobile for maximum performance */}
      {!isMobile && (
        <EffectComposer>
          <Bloom
            intensity={1.2}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.85}
          />
          <Vignette offset={0.3} darkness={0.45} />
        </EffectComposer>
      )}
    </>
  );
}

// ==========================================
// 💡 360-Degree Analog Touch Joystick for Mobile
// ==========================================
interface TouchJoystickProps {
  onMove: (controls: Partial<MobileControlsState>) => void;
}

function TouchJoystick({ onMove }: TouchJoystickProps) {
  const joystickRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  const maxRadius = 45; // Max displacement radius in pixels

  // 💡 Lock page scrolling ONLY when user is touching/dragging the Joystick
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
      className={`relative w-28 h-28 rounded-full bg-white/45 backdrop-blur-md border ${
        active ? 'border-[#0066CC] bg-white/70 shadow-lg scale-105' : 'border-black/15 shadow-md'
      } transition-transform flex items-center justify-center touch-none select-none cursor-pointer`}
    >
      {/* Inner Ring Guide */}
      <div className="w-16 h-16 rounded-full border border-black/10 pointer-events-none" />

      {/* Draggable Knob */}
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
// 4. Exported Interactive Hero Car Canvas Component
// ==========================================
export default function InteractiveHeroCar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [speedKmh, setSpeedKmh] = useState(0);
  const [resetTrigger, setResetTrigger] = useState(0);

  // Mobile Touch Control state
  const [mobileControls, setMobileControls] = useState<MobileControlsState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
  });

  // ------------------------------------------
  // 💡 Optimization 1: Smart GPU Throttling via IntersectionObserver
  // ------------------------------------------
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

  // ------------------------------------------
  // 💡 Optimization 2: Mobile Viewport Detection for Adaptive Tiering
  // ------------------------------------------
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ------------------------------------------
  // 💡 Optimization 3: Scroll Conflict Resolution (Prevent Default Page Jump)
  // ------------------------------------------
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

  return (
    <div ref={containerRef} className="relative w-full h-full select-none pointer-events-none md:pointer-events-auto">
      {/* 3D WebGL Canvas Layer (Frameloop paused when off-screen) */}
      <KeyboardControls map={keyboardMap}>
        <Canvas
          shadows={!isMobile}
          camera={{ position: [0, 3.5, 8.5], fov: 50 }}
          className="w-full h-full bg-[#0F172A]"
          dpr={isMobile ? [1, 1] : [1, 1.5]} // 💡 High-Performance DPR capping
          frameloop={isInView ? 'always' : 'never'} // 💡 Off-Screen GPU Throttling
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        >
          <GameScene
            mobileControls={mobileControls}
            onSpeedUpdate={setSpeedKmh}
            resetTrigger={resetTrigger}
            isInView={isInView}
            isMobile={isMobile}
          />
        </Canvas>
      </KeyboardControls>

      {/* Apex Racing Telemetry & HUD Overlay (Positioned below top Navbar pill) */}
      <div className="absolute top-24 right-4 md:right-8 z-20 pointer-events-auto flex items-center gap-2.5">
        {/* Speedometer Badge */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/80 backdrop-blur-md border border-black/[0.08] rounded-full shadow-xs">
          <Zap className="w-3.5 h-3.5 text-[#0066CC] animate-pulse" />
          <span className="font-mono text-xs font-bold text-[#09090B]">
            {speedKmh} <span className="text-[10px] text-[#71717A] font-normal">KM/H</span>
          </span>
        </div>

        {/* Reset Car Button */}
        <button
          onClick={() => setResetTrigger((prev) => prev + 1)}
          className="p-2 bg-white/80 backdrop-blur-md border border-black/[0.08] hover:bg-white text-[#09090B] rounded-full shadow-xs transition-all hover:scale-105 active:scale-95 touch-target cursor-pointer"
          title="Reset Car Position (R)"
          aria-label="Reset Car"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#71717A]" />
        </button>
      </div>

      {/* On-Screen Driving Controls Guide (Desktop) */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none hidden md:flex items-center gap-2 font-mono text-[11px] text-[#71717A] bg-white/80 backdrop-blur-md border border-black/[0.08] px-3.5 py-1.5 rounded-full shadow-2xs">
        <span className="px-1.5 py-0.5 bg-[#F2F2F7] rounded text-[#09090B] font-semibold">WASD</span>
        <span>/</span>
        <span className="px-1.5 py-0.5 bg-[#F2F2F7] rounded text-[#09090B] font-semibold">ARROWS</span>
        <span>TO DRIVE</span>
        <span className="mx-1">•</span>
        <span className="px-1.5 py-0.5 bg-[#F2F2F7] rounded text-[#09090B] font-semibold">SPACE</span>
        <span>DRIFT/BRAKE</span>
        <span className="mx-1">•</span>
        <span className="px-1.5 py-0.5 bg-[#F2F2F7] rounded text-[#09090B] font-semibold">R</span>
        <span>RESET</span>
      </div>

      {/* 💡 Mobile View Controls: Pure 360° Touch Joystick (Page scroll works everywhere except on joystick) */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-auto flex md:hidden items-center select-none">
        <TouchJoystick onMove={handleJoystickMove} />
      </div>
    </div>
  );
}
