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
import { RefreshCw, Zap, ShieldCheck } from 'lucide-react';

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

interface MobileControlsState {
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
    const quat = new THREE.Quaternion(rot.x, rot.y, rot.z, rot.w);

    // Direction vectors
    const forwardVec = new THREE.Vector3(0, 0, -1).applyQuaternion(quat);
    const rightVec = new THREE.Vector3(1, 0, 0).applyQuaternion(quat);

    // Current speeds
    const currentVel = new THREE.Vector3(linvel.x, linvel.y, linvel.z);
    const speed = currentVel.length();
    const forwardSpeed = currentVel.dot(forwardVec);
    const speedKmh = Math.round(speed * 3.6);
    onSpeedUpdate(speedKmh);

    // ------------------------------------------
    // A. Driving Dynamics & Acceleration Tuning
    // ------------------------------------------
    const acceleration = 38.0;
    const reverseAccel = 22.0;
    const maxSpeed = 32.0; // ~115 km/h top speed inside Hero section
    const steerSpeed = 2.4;

    // Apply forward/backward propulsion
    if (isForward && forwardSpeed < maxSpeed) {
      const force = forwardVec.clone().multiplyScalar(acceleration * rigidBodyRef.current.mass() * delta);
      rigidBodyRef.current.applyImpulse(force, true);
    } else if (isBackward && forwardSpeed > -maxSpeed * 0.4) {
      const force = forwardVec.clone().multiplyScalar(-reverseAccel * rigidBodyRef.current.mass() * delta);
      rigidBodyRef.current.applyImpulse(force, true);
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
      // Scale steering strength based on velocity direction
      const directionMultiplier = forwardSpeed >= -0.5 ? 1 : -1;
      const turnTorque = currentSteerAngle.current * steerSpeed * directionMultiplier;
      rigidBodyRef.current.setAngvel(
        { x: rigidBodyRef.current.angvel().x, y: turnTorque, z: rigidBodyRef.current.angvel().z },
        true
      );
    }

    // ------------------------------------------
    // C. Lateral Drift Damping (Apex Racing Feel)
    // ------------------------------------------
    const lateralVel = currentVel.dot(rightVec);
    const driftFactor = isBrake ? 0.85 : 0.45; // Enhanced sliding when braking
    const counterForce = rightVec.clone().multiplyScalar(-lateralVel * driftFactor * rigidBodyRef.current.mass() * delta * 60);
    rigidBodyRef.current.applyImpulse(counterForce, true);

    // Braking
    if (isBrake) {
      const brakeForce = currentVel.clone().multiplyScalar(-0.6 * rigidBodyRef.current.mass() * delta);
      rigidBodyRef.current.applyImpulse(brakeForce, true);
    }

    // Stabilize roll & pitch to prevent flipping upside down
    const euler = new THREE.Euler().setFromQuaternion(quat, 'YXZ');
    if (Math.abs(euler.x) > 0.35 || Math.abs(euler.z) > 0.35) {
      const resetQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, euler.y, 0));
      rigidBodyRef.current.setRotation(resetQuat, true);
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
    if (Math.abs(pos.x) > 160 || Math.abs(pos.z) > 160) {
      const newX = Math.abs(pos.x) > 160 ? (pos.x > 0 ? -120 : 120) : pos.x;
      const newZ = Math.abs(pos.z) > 160 ? (pos.z > 0 ? -120 : 120) : pos.z;
      rigidBodyRef.current.setTranslation({ x: newX, y: pos.y, z: pos.z }, true);
    }

    // ------------------------------------------
    // F. Cinematic Chase Camera System
    // ------------------------------------------
    const carPos = new THREE.Vector3(pos.x, pos.y, pos.z);

    // Dynamic offset behind car
    const camDistance = 8.2 + Math.min(speed * 0.08, 2.5);
    const camHeight = 3.2 + Math.min(speed * 0.04, 1.2);

    // Smooth trailing position calculation
    const camOffset = new THREE.Vector3(0, camHeight, camDistance).applyQuaternion(quat);
    const targetCamPos = carPos.clone().add(camOffset);

    // Smooth lerp camera position
    state.camera.position.lerp(targetCamPos, delta * 6.5);

    // Look-at point slightly in front of car
    const lookAtOffset = new THREE.Vector3(0, 0.8, -3.5).applyQuaternion(quat);
    const targetLookAt = carPos.clone().add(lookAtOffset);

    state.camera.lookAt(targetLookAt);

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
            emissiveIntensity={8.0}
            toneMapped={false}
          />
        </mesh>

        {/* Dynamic Forward Headlight Beams (Spotlights) */}
        <pointLight position={[-0.7, 0.45, -2.2]} intensity={18.0} distance={15} color="#60A5FA" />
        <pointLight position={[0.7, 0.45, -2.2]} intensity={18.0} distance={15} color="#60A5FA" />

        {/* Rear Taillight Continuous LED Bar (Apex Neon Red Bloom) */}
        <mesh position={[0, 0.46, 2.06]}>
          <boxGeometry args={[1.75, 0.09, 0.08]} />
          <meshStandardMaterial
            color="#EF4444"
            emissive="#EF4444"
            emissiveIntensity={10.0}
            toneMapped={false}
          />
        </mesh>

        {/* Dynamic Rear Taillight Road Illumination */}
        <pointLight position={[0, 0.46, 2.3]} intensity={14.0} distance={8} color="#EF4444" />

        {/* Futuristic Cyber Neon Chassis Underglow */}
        <pointLight position={[0, 0.15, 0]} intensity={12.0} distance={5} color="#0066CC" />

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

interface SmashableObjectItem {
  id: number;
  type: 'glassCube' | 'metallicSphere' | 'neonPrism';
  position: [number, number, number];
  scale: number;
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
    ];

    coordinates.forEach((coord, i) => {
      const type = types[i % types.length];
      const scale = 0.8 + (i % 3) * 0.35;
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
// Dynamic Truly Infinite Floor Component
// ==========================================
function InfiniteFloor() {
  const floorRef = useRef<THREE.Mesh>(null);
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame((state) => {
    const camPos = state.camera.position;
    if (floorRef.current) {
      floorRef.current.position.x = camPos.x;
      floorRef.current.position.z = camPos.z;
    }
    if (gridRef.current) {
      gridRef.current.position.x = Math.floor(camPos.x / 4) * 4;
      gridRef.current.position.z = Math.floor(camPos.z / 4) * 4;
    }
  });

  return (
    <group>
      {/* Infinite Fixed Collider Floor */}
      <RigidBody type="fixed" friction={0.7} restitution={0.2}>
        <CuboidCollider args={[400, 0.5, 400]} position={[0, -0.5, 0]} />
      </RigidBody>

      {/* Dynamic Visual Floor Plane Following Camera */}
      <mesh ref={floorRef} position={[0, -0.01, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[600, 600]} />
        <meshStandardMaterial color="#F4F4F5" roughness={0.75} metalness={0.01} />
      </mesh>

      {/* Dynamic Grid Following Camera Snapped to Grid Units */}
      <gridHelper ref={gridRef} args={[600, 300, '#D4D4D8', '#E4E4E7']} position={[0, 0.01, 0]} />
    </group>
  );
}

// ==========================================
// 3. Main Scene Setup with Adaptive Mobile FX
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
      {/* 💡 Atmospheric Depth Fog for Infinite Smooth Horizon Fade */}
      <fog attach="fog" args={['#FCFCFC', 20, 90]} />

      {/* 💡 Soft Subdued Ambient Fill Light */}
      <hemisphereLight args={['#FFFFFF', '#F4F4F5', 0.45]} />

      {/* Toned Down Key Directional Light */}
      <directionalLight
        position={[25, 35, 20]}
        intensity={1.0}
        castShadow={!isMobile} // Optimize shadows on mobile
        shadow-mapSize={isMobile ? [1024, 1024] : [2048, 2048]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0001}
      />

      {/* Soft Rim Light */}
      <directionalLight position={[-25, 30, -25]} intensity={0.6} color="#60A5FA" />

      {/* Subtle Background Ambient Accent */}
      <pointLight position={[0, 12, -35]} intensity={6.0} color="#38BDF8" distance={65} />
      <Environment preset="city" />

      <Physics gravity={[0, -9.81, 0]}>
        {/* Dynamic Infinite Floor & Grid */}
        <InfiniteFloor />

        {/* Driveable Raycast Arcade Vehicle */}
        <ArcadeVehicle
          mobileControls={mobileControls}
          onSpeedUpdate={onSpeedUpdate}
          resetTrigger={resetTrigger}
          isInView={isInView}
        />

        {/* Collidable Smashable Objects */}
        <SmashableObjects />
      </Physics>

      {/* Realistic Soft Contact Shadows */}
      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={0.55}
        scale={60}
        blur={1.8}
        far={12}
        color="#000000"
      />

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
        // Prevent default native page scrolling if user is engaged on page
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

  // ------------------------------------------
  // 💡 Universal Touch & Mobile Swipe Lock (Eliminates Drag/Swipe Scroll Jumps)
  // ------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e: Event) => {
      if (e.cancelable && isInView) {
        const activeElem = document.activeElement as HTMLElement | null;
        const isInputElement =
          activeElem &&
          (activeElem.tagName === 'INPUT' ||
            activeElem.tagName === 'TEXTAREA' ||
            activeElem.isContentEditable);
        if (!isInputElement) {
          e.preventDefault();
        }
      }
    };

    container.addEventListener('touchmove', preventScroll, { passive: false });
    container.addEventListener('touchstart', preventScroll, { passive: false });

    return () => {
      container.removeEventListener('touchmove', preventScroll);
      container.removeEventListener('touchstart', preventScroll);
    };
  }, [isInView]);

  const handleTouchStart = (control: keyof MobileControlsState) => {
    setMobileControls((prev) => ({ ...prev, [control]: true }));
  };

  const handleTouchEnd = (control: keyof MobileControlsState) => {
    setMobileControls((prev) => ({ ...prev, [control]: false }));
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* 3D WebGL Canvas Layer (Frameloop paused when off-screen) */}
      <KeyboardControls map={keyboardMap}>
        <Canvas
          shadows={!isMobile}
          camera={{ position: [0, 3.5, 8.5], fov: 50 }}
          className="w-full h-full bg-[#FCFCFC]"
          dpr={isMobile ? [1, 1.25] : [1, 2]} // 💡 Adaptive Mobile DPR
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

      {/* Apex Racing Telemetry & HUD Overlay (z-20 pointer-events-auto) */}
      <div className="absolute top-6 right-6 z-20 pointer-events-auto flex items-center gap-3">
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

      {/* Mobile Touch Control Layer (z-20 pointer-events-auto) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex md:hidden flex-col items-center gap-2 select-none">
        {/* D-Pad Steering & Drive Controls */}
        <div className="flex items-center gap-3">
          {/* Left / Right Steering */}
          <div className="flex items-center gap-1.5">
            <button
              onMouseDown={() => handleTouchStart('left')}
              onMouseUp={() => handleTouchEnd('left')}
              onTouchStart={(e) => {
                e.preventDefault();
                handleTouchStart('left');
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleTouchEnd('left');
              }}
              className="w-12 h-12 bg-white/90 border border-black/10 rounded-full font-mono text-sm font-bold text-[#09090B] active:bg-black active:text-white shadow-sm flex items-center justify-center select-none cursor-pointer"
            >
              ←
            </button>
            <button
              onMouseDown={() => handleTouchStart('right')}
              onMouseUp={() => handleTouchEnd('right')}
              onTouchStart={(e) => {
                e.preventDefault();
                handleTouchStart('right');
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleTouchEnd('right');
              }}
              className="w-12 h-12 bg-white/90 border border-black/10 rounded-full font-mono text-sm font-bold text-[#09090B] active:bg-black active:text-white shadow-sm flex items-center justify-center select-none cursor-pointer"
            >
              →
            </button>
          </div>

          {/* Forward / Reverse / Brake */}
          <div className="flex items-center gap-1.5">
            <button
              onMouseDown={() => handleTouchStart('backward')}
              onMouseUp={() => handleTouchEnd('backward')}
              onTouchStart={(e) => {
                e.preventDefault();
                handleTouchStart('backward');
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleTouchEnd('backward');
              }}
              className="w-12 h-12 bg-white/90 border border-black/10 rounded-full font-mono text-xs font-bold text-[#71717A] active:bg-black active:text-white shadow-sm flex items-center justify-center select-none cursor-pointer"
            >
              REV
            </button>
            <button
              onMouseDown={() => handleTouchStart('brake')}
              onMouseUp={() => handleTouchEnd('brake')}
              onTouchStart={(e) => {
                e.preventDefault();
                handleTouchStart('brake');
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleTouchEnd('brake');
              }}
              className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-full font-mono text-xs font-bold text-red-600 active:bg-red-600 active:text-white shadow-sm flex items-center justify-center select-none cursor-pointer"
            >
              STOP
            </button>
            <button
              onMouseDown={() => handleTouchStart('forward')}
              onMouseUp={() => handleTouchEnd('forward')}
              onTouchStart={(e) => {
                e.preventDefault();
                handleTouchStart('forward');
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                handleTouchEnd('forward');
              }}
              className="w-12 h-12 bg-[#09090B] text-white rounded-full font-mono text-xs font-bold active:bg-black shadow-sm flex items-center justify-center select-none cursor-pointer"
            >
              GAS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
