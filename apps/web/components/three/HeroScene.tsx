"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);
    const handleMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleMotionChange);

    // Check WebGL availability
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    // Three.js Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // Central Code Artifact: Icosahedron Wireframe Core
    const coreGeo = new THREE.IcosahedronGeometry(1.6, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x50E6FF,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    // Inner Solid Node
    const innerGeo = new THREE.OctahedronGeometry(0.8);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xC8FF4D,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerMesh);

    // Orbiting Evidence Nodes
    const nodeCount = 5;
    const evidenceNodes: THREE.Mesh[] = [];
    const nodeGroup = new THREE.Group();

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 2.8;
      const nodeGeo = new THREE.SphereGeometry(0.08, 12, 12);
      const nodeMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xC8FF4D : 0x50E6FF,
      });
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      node.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.4, Math.sin(angle) * 1.5);
      evidenceNodes.push(node);
      nodeGroup.add(node);
    }
    scene.add(nodeGroup);

    // Connecting Tracer Lines
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x50E6FF,
      transparent: true,
      opacity: 0.25,
    });
    const lineGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(nodeCount * 6);
    lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    const tracerLines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(tracerLines);

    // Animation Loop with Visibility and Reduced Motion Controls
    let animId: number;
    let isVisible = true;

    const handleVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const delta = clock.getDelta();
      const speed = reducedMotion ? 0 : 0.4;

      coreMesh.rotation.y += delta * speed * 0.6;
      coreMesh.rotation.x += delta * speed * 0.3;
      innerMesh.rotation.y -= delta * speed * 0.8;
      innerMesh.rotation.z += delta * speed * 0.4;
      nodeGroup.rotation.y += delta * speed * 0.5;

      // Update connecting line vertices from center to orbiting evidence nodes
      const posArray = lineGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < nodeCount; i++) {
        const nodeWorldPos = new THREE.Vector3();
        evidenceNodes[i].getWorldPosition(nodeWorldPos);
        const idx = i * 6;
        // Point 1: core center
        posArray[idx] = 0;
        posArray[idx + 1] = 0;
        posArray[idx + 2] = 0;
        // Point 2: node position
        posArray[idx + 3] = nodeWorldPos.x;
        posArray[idx + 4] = nodeWorldPos.y;
        posArray[idx + 5] = nodeWorldPos.z;
      }
      lineGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup resources
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
      mediaQuery.removeEventListener("change", handleMotionChange);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      coreGeo.dispose();
      coreMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      renderer.dispose();
    };
  }, [reducedMotion]);

  if (!hasWebGL) {
    return (
      <div className="relative w-full h-[400px] flex items-center justify-center border border-border/40 rounded-xl bg-surface/30">
        <div className="text-center p-6 space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full border border-accent/40 bg-accent/10 flex items-center justify-center text-accent font-mono text-xl">
            BBH
          </div>
          <p className="text-xs font-mono text-foreground-muted">Forensic Investigation Topology</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] md:h-[480px] flex items-center justify-center">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      {/* Decorative scanner line */}
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/40 to-transparent" />
      <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 text-[10px] font-mono text-foreground-muted bg-background/80 px-2 py-1 rounded border border-border">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        REPRODUCTION_LADDER_ACTIVE
      </div>
    </div>
  );
}
