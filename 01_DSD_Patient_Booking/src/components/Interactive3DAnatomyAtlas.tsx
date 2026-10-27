import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface Interactive3DAnatomyAtlasProps {
  selectedOrgan: string | null;
  onSelectOrgan: (organId: string) => void;
  className?: string;
}

export interface OrganNodeData {
  id: string;
  name: string;
  position: [number, number, number];
  color: string;
  secondaryColor: string;
  scale: [number, number, number];
  pulseSpeed: number;
  label: string;
}

const ORGAN_NODES: OrganNodeData[] = [
  {
    id: 'heart',
    name: 'Heart (Cardiac)',
    position: [0.15, 0.45, 0.2],
    color: '#ff2a5f',
    secondaryColor: '#ff003c',
    scale: [0.22, 0.26, 0.22],
    pulseSpeed: 6.0,
    label: 'Heart · Lipid & hs-CRP'
  },
  {
    id: 'diabetes',
    name: 'Pancreas & Metabolism',
    position: [0.05, 0.05, 0.18],
    color: '#00f0ff',
    secondaryColor: '#0ea5e9',
    scale: [0.35, 0.16, 0.18],
    pulseSpeed: 3.5,
    label: 'Pancreas · HbA1c & Fasting Glucose'
  },
  {
    id: 'liver',
    name: 'Liver (Hepatic)',
    position: [-0.35, 0.15, 0.22],
    color: '#f59e0b',
    secondaryColor: '#fbbf24',
    scale: [0.42, 0.32, 0.28],
    pulseSpeed: 2.5,
    label: 'Liver · LFT & Bilirubin'
  },
  {
    id: 'kidney',
    name: 'Kidneys (Renal)',
    position: [0.32, -0.15, -0.1],
    color: '#06b6d4',
    secondaryColor: '#38bdf8',
    scale: [0.22, 0.28, 0.2],
    pulseSpeed: 3.0,
    label: 'Kidneys · KFT & Creatinine'
  },
  {
    id: 'thyroid',
    name: 'Thyroid (Endocrine)',
    position: [0.0, 0.95, 0.15],
    color: '#a855f7',
    secondaryColor: '#c084fc',
    scale: [0.24, 0.16, 0.14],
    pulseSpeed: 4.0,
    label: 'Thyroid · T3, T4, TSH'
  },
  {
    id: 'bone',
    name: 'Joints & Skeleton',
    position: [-0.38, -0.85, 0.15],
    color: '#e2e8f0',
    secondaryColor: '#38bdf8',
    scale: [0.2, 0.2, 0.2],
    pulseSpeed: 1.5,
    label: 'Joints · Vit D3 & Calcium'
  }
];

export const Interactive3DAnatomyAtlas: React.FC<Interactive3DAnatomyAtlasProps> = ({
  selectedOrgan,
  onSelectOrgan,
  className = ''
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 400;
    let height = container.clientHeight || 520;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.18);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.1, 4.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x00f0ff, 1.8);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xff2a5f, 1.5);
    rimLight.position.set(-3, -2, -2);
    scene.add(rimLight);

    // 3. Stylized Translucent Human Anatomical Silhouette (Learn Anatomy 3D Style)
    const bodyGroup = new THREE.Group();
    scene.add(bodyGroup);

    // Head
    const headGeo = new THREE.SphereGeometry(0.42, 24, 24);
    const headMat = new THREE.MeshPhysicalMaterial({
      color: 0x0ea5e9,
      transmission: 0.88,
      opacity: 1,
      transparent: true,
      roughness: 0.25,
      ior: 1.3,
      thickness: 0.5,
      emissive: 0x0284c7,
      emissiveIntensity: 0.15,
      wireframe: false
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(0, 1.35, 0);
    head.scale.set(0.9, 1.15, 0.95);
    bodyGroup.add(head);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.35, 16);
    const neck = new THREE.Mesh(neckGeo, headMat);
    neck.position.set(0, 0.92, 0);
    bodyGroup.add(neck);

    // Torso / Chest / Ribcage
    const torsoGeo = new THREE.CylinderGeometry(0.68, 0.52, 1.45, 24, 8);
    const torsoMat = new THREE.MeshPhysicalMaterial({
      color: 0x0369a1,
      transmission: 0.85,
      opacity: 1,
      transparent: true,
      roughness: 0.3,
      ior: 1.25,
      thickness: 0.8,
      emissive: 0x082f49,
      emissiveIntensity: 0.2
    });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.set(0, 0.25, 0);
    torso.scale.set(1.05, 1, 0.68);
    bodyGroup.add(torso);

    // Spine & Neural Axis (Glow Line)
    const spineCurve = new THREE.LineCurve3(new THREE.Vector3(0, 1.3, -0.15), new THREE.Vector3(0, -0.6, -0.12));
    const spineGeo = new THREE.TubeGeometry(spineCurve, 20, 0.035, 8, false);
    const spineMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.7 });
    const spine = new THREE.Mesh(spineGeo, spineMat);
    bodyGroup.add(spine);

    // Holographic Wireframe Cage Overlay
    const wireTorso = new THREE.WireframeGeometry(torsoGeo);
    const wireMat = new THREE.LineBasicMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.08 });
    const wireLines = new THREE.LineSegments(wireTorso, wireMat);
    wireLines.position.copy(torso.position);
    wireLines.scale.copy(torso.scale);
    bodyGroup.add(wireLines);

    // 4. Glowing Anatomical Organ Nodes
    const organMeshes: { data: OrganNodeData; mesh: THREE.Mesh; glowMesh: THREE.Mesh }[] = [];

    ORGAN_NODES.forEach((org) => {
      const orgGroup = new THREE.Group();
      orgGroup.position.set(...org.position);

      const geo = new THREE.SphereGeometry(1, 24, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: org.color,
        emissive: org.color,
        emissiveIntensity: 0.8,
        roughness: 0.2,
        metalness: 0.1
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.scale.set(...org.scale);
      mesh.userData = { organId: org.id };
      orgGroup.add(mesh);

      // Outer Halo Aura / Bloom Mesh
      const glowGeo = new THREE.SphereGeometry(1.3, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: org.color,
        transparent: true,
        opacity: 0.25,
        wireframe: true
      });
      const glowMesh = new THREE.Mesh(glowGeo, glowMat);
      glowMesh.scale.set(...org.scale);
      orgGroup.add(glowMesh);

      bodyGroup.add(orgGroup);
      organMeshes.push({ data: org, mesh, glowMesh });
    });

    // 5. Floating Ambient Bio-particles
    const particleCount = 80;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 4;
      particlePositions[i + 1] = (Math.random() - 0.5) * 4;
      particlePositions[i + 2] = (Math.random() - 0.5) * 2;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.035,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const bioParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(bioParticles);

    // 6. Raycasting & Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const targets = organMeshes.map(o => o.mesh);
      const intersects = raycaster.intersectObjects(targets);

      if (intersects.length > 0) {
        const hitId = intersects[0].object.userData.organId;
        if (hitId) {
          onSelectOrgan(hitId);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);

    // 7. Mouse drag rotation
    let isDragging = false;
    let prevMouseX = 0;
    let targetRotationY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      targetRotationY += deltaX * 0.008;
      prevMouseX = e.clientX;
    };
    const onMouseUp = () => {
      isDragging = false;
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // 8. Animation Loop with High-Precision Performance Timestamp (Zero Deprecation)
    const startTime = performance.now();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const t = (performance.now() - startTime) * 0.001;

      // Smooth damped spring rotation
      bodyGroup.rotation.y += (targetRotationY - bodyGroup.rotation.y) * 0.08;
      if (!isDragging) {
        targetRotationY += 0.0025; // Gentle ambient rotation
      }

      // Gentle floating breathing sway
      bodyGroup.position.y = Math.sin(t * 1.5) * 0.04;

      // Animate organ pulses
      organMeshes.forEach(({ data, mesh, glowMesh }) => {
        const isSelected = selectedOrgan === data.id;
        const pulse = 1 + Math.sin(t * data.pulseSpeed) * (isSelected ? 0.22 : 0.06);

        mesh.scale.set(
          data.scale[0] * pulse * (isSelected ? 1.35 : 1),
          data.scale[1] * pulse * (isSelected ? 1.35 : 1),
          data.scale[2] * pulse * (isSelected ? 1.35 : 1)
        );

        glowMesh.scale.copy(mesh.scale).multiplyScalar(1.25);

        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = isSelected ? 1.8 : 0.6;

        const glowM = glowMesh.material as THREE.MeshBasicMaterial;
        glowM.opacity = isSelected ? 0.55 : 0.18;
      });

      // Bio particles slow drift
      bioParticles.rotation.y = t * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Listener
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [selectedOrgan, onSelectOrgan]);

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full min-h-[440px] cursor-grab active:cursor-grabbing" />

      {/* Holographic HUD Overlay & Organ Indicator */}
      <div className="absolute top-4 left-4 pointer-events-none space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping inline-block" />
          <span className="font-mono text-[11px] font-bold text-cyan-300 tracking-wider uppercase">
            3D Body Atlas · Interactive Raycasting
          </span>
        </div>
        <p className="text-[11px] text-slate-400 font-sans">
          Click an organ or disease card to trigger 3D focal resonance.
        </p>
      </div>

      {/* Active Organ Chip Tag */}
      {selectedOrgan && (
        <div className="absolute bottom-4 right-4 pointer-events-none bg-slate-900/90 border border-cyan-500/40 rounded-xl px-3.5 py-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95">
          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
            Target Focus Active
          </div>
          <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            {ORGAN_NODES.find(o => o.id === selectedOrgan)?.label || selectedOrgan}
          </div>
        </div>
      )}
    </div>
  );
};

export default Interactive3DAnatomyAtlas;
