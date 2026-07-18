"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbitData, OrbitNode } from "@/lib/orbit-layout";

/* ---- Vault Core nucleus -------------------------------------------------- */
function Core() {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!ref.current) return;
    ref.current.rotation.y = s.clock.elapsedTime * 0.08;
    ref.current.scale.setScalar(1 + Math.sin(s.clock.elapsedTime * 1.2) * 0.03);
  });
  return (
    <group ref={ref}>
      <mesh>
        <icosahedronGeometry args={[1.1, 1]} />
        <meshStandardMaterial color="#C17A2B" emissive="#C17A2B" emissiveIntensity={1} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh scale={1.55}>
        <icosahedronGeometry args={[1.1, 0]} />
        <meshBasicMaterial color="#E8E1D9" wireframe transparent opacity={0.16} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={2.2} distance={32} color="#ffca73" />
    </group>
  );
}

function Ring({ radius, color, dim }: { radius: number; color: string; dim: boolean }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.012, 8, 160]} />
      <meshBasicMaterial color={color} transparent opacity={dim ? 0.08 : 0.3} />
    </mesh>
  );
}

function CourseNode({
  node,
  selectedCode,
  highlightCode,
  visible,
  onSelect,
  appearDelay,
}: {
  node: OrbitNode;
  selectedCode: string | null;
  highlightCode: string | null;
  visible: boolean;
  onSelect: (n: OrbitNode) => void;
  appearDelay: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const [hovered, setHovered] = useState(false);
  const startedAt = useRef<number | undefined>(undefined);

  const isSelected = selectedCode === node.code;
  const isHighlighted = highlightCode === node.code;
  const dimmedBySelection = !!selectedCode && !isSelected;
  const focusUp = hovered || isSelected || isHighlighted;
  const showLabel = focusUp && visible;

  useFrame((s) => {
    if (startedAt.current === undefined) startedAt.current = s.clock.elapsedTime;
    const appeared = s.clock.elapsedTime - startedAt.current > appearDelay;
    const m = mesh.current;
    if (m) {
      const base = appeared ? (visible ? 1 : 0.55) : 0;
      const target = base * (focusUp ? 1.7 : 1);
      m.scale.setScalar(THREE.MathUtils.lerp(m.scale.x, target, 0.16));
      m.position.y = Math.sin(s.clock.elapsedTime * 0.45 + node.angle) * 0.06;
    }
    if (mat.current) {
      const opacity = !visible ? 0.06 : dimmedBySelection ? 0.14 : 1;
      mat.current.opacity = THREE.MathUtils.lerp(mat.current.opacity, opacity, 0.1);
      const emis = !visible ? 0.05 : focusUp ? 1.5 : dimmedBySelection ? 0.1 : 0.5;
      mat.current.emissiveIntensity = THREE.MathUtils.lerp(mat.current.emissiveIntensity, emis, 0.1);
    }
  });

  return (
    <group position={[node.x, 0, node.z]}>
      <mesh
        ref={mesh}
        scale={0}
        onPointerOver={(e) => {
          if (!visible) return;
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "";
        }}
        onClick={(e) => {
          if (!visible) return;
          e.stopPropagation();
          onSelect(node);
        }}
      >
        <sphereGeometry args={[0.24, 18, 18]} />
        <meshStandardMaterial
          ref={mat}
          color={node.color}
          emissive={node.color}
          emissiveIntensity={0.5}
          metalness={0.3}
          roughness={0.4}
          transparent
        />
      </mesh>

      {showLabel && (
        <Html center position={[0, 0.62, 0]} style={{ pointerEvents: "none" }} zIndexRange={[60, 0]}>
          <div className="-translate-y-1 whitespace-nowrap rounded-md glass-strong px-2 py-1 text-[10px] font-semibold text-fg shadow-glow">
            {node.code}
            {hovered && <span className="ml-1.5 font-normal text-accent">{node.fileCount}</span>}
          </div>
        </Html>
      )}
    </group>
  );
}

function Rig({ selectedCode, nodes }: { selectedCode: string | null; nodes: OrbitNode[] }) {
  const target = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const camDesired = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 2.6, 0), []);

  useFrame((state) => {
    const controls = state.controls as unknown as { target: THREE.Vector3 } | null;
    if (!controls) return;
    const node = selectedCode ? nodes.find((n) => n.code === selectedCode) : undefined;
    if (node) {
      target.set(node.x, 0, node.z);
      controls.target.lerp(target, 0.08);
      dir.copy(target).normalize();
      camDesired.copy(target).addScaledVector(dir, 5.2).add(up);
      state.camera.position.lerp(camDesired, 0.06);
    } else {
      controls.target.lerp(target.set(0, 0, 0), 0.05);
    }
  });
  return null;
}

export default function OrbitScene({
  data,
  selectedCode,
  highlightCode,
  visibleCodes,
  onSelect,
}: {
  data: OrbitData;
  selectedCode: string | null;
  highlightCode: string | null;
  visibleCodes: Set<string> | null;
  onSelect: (n: OrbitNode | null) => void;
}) {
  const [engaged, setEngaged] = useState(false);
  const autoRotate = !engaged && !selectedCode;

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 7, 18], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => onSelect(null)}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 10, 8]} intensity={0.5} color="#E8E1D9" />

      <Core />
      {data.rings.map((r) => {
        const dim =
          !!visibleCodes &&
          !data.nodes.some((n) => n.category === r.category && visibleCodes.has(n.code));
        return <Ring key={r.category} radius={r.radius} color={r.color} dim={dim} />;
      })}
      {data.nodes.map((n, i) => (
        <CourseNode
          key={n.code}
          node={n}
          selectedCode={selectedCode}
          highlightCode={highlightCode}
          visible={!visibleCodes || visibleCodes.has(n.code)}
          onSelect={onSelect}
          appearDelay={0.1 + i * 0.02}
        />
      ))}

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.55}
        zoomSpeed={0.8}
        autoRotate={autoRotate}
        autoRotateSpeed={0.25}
        minDistance={3}
        maxDistance={30}
        minPolarAngle={Math.PI * 0.12}
        maxPolarAngle={Math.PI * 0.85}
        onStart={() => setEngaged(true)}
      />
      <Rig selectedCode={selectedCode} nodes={data.nodes} />
    </Canvas>
  );
}
