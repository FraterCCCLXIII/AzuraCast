"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export type GradientScheme = 1 | 2 | 3 | 4 | 5;

interface SchemeColors {
  color1: THREE.Vector3;
  color2: THREE.Vector3;
  color3?: THREE.Vector3;
  color4?: THREE.Vector3;
  color5?: THREE.Vector3;
  color6?: THREE.Vector3;
}

const COLOR_SCHEMES: Record<GradientScheme, SchemeColors> = {
  1: {
    color1: new THREE.Vector3(0.945, 0.353, 0.133),
    color2: new THREE.Vector3(0.039, 0.055, 0.153),
  },
  2: {
    color1: new THREE.Vector3(1.0, 0.424, 0.314),
    color2: new THREE.Vector3(0.251, 0.878, 0.816),
  },
  3: {
    color1: new THREE.Vector3(0.945, 0.353, 0.133),
    color2: new THREE.Vector3(0.039, 0.055, 0.153),
    color3: new THREE.Vector3(0.251, 0.878, 0.816),
  },
  4: {
    color1: new THREE.Vector3(0.949, 0.4, 0.2),
    color2: new THREE.Vector3(0.176, 0.42, 0.427),
    color3: new THREE.Vector3(0.82, 0.686, 0.612),
  },
  5: {
    color1: new THREE.Vector3(0.945, 0.353, 0.133),
    color2: new THREE.Vector3(0.0, 0.259, 0.22),
    color3: new THREE.Vector3(0.945, 0.353, 0.133),
    color4: new THREE.Vector3(0.0, 0.0, 0.0),
    color5: new THREE.Vector3(0.945, 0.353, 0.133),
    color6: new THREE.Vector3(0.0, 0.0, 0.0),
  },
};

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vec3 pos = position.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
    vUv = uv;
  }
`;

const FRAGMENT_SHADER = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform vec3 uColor3;
  uniform vec3 uColor4;
  uniform vec3 uColor5;
  uniform vec3 uColor6;
  uniform float uSpeed;
  uniform float uIntensity;
  uniform sampler2D uTouchTexture;
  uniform float uGrainIntensity;
  uniform vec3 uDarkNavy;
  uniform float uGradientSize;
  uniform float uGradientCount;
  uniform float uColor1Weight;
  uniform float uColor2Weight;

  varying vec2 vUv;

  #define PI 3.14159265359

  float grain(vec2 uv, float time) {
    vec2 grainUv = uv * uResolution * 0.5;
    float grainValue = fract(sin(dot(grainUv + time, vec2(12.9898, 78.233))) * 43758.5453);
    return grainValue * 2.0 - 1.0;
  }

  vec3 getGradientColor(vec2 uv, float time) {
    float gradientRadius = uGradientSize;

    vec2 center1 = vec2(0.5 + sin(time * uSpeed * 0.4) * 0.4, 0.5 + cos(time * uSpeed * 0.5) * 0.4);
    vec2 center2 = vec2(0.5 + cos(time * uSpeed * 0.6) * 0.5, 0.5 + sin(time * uSpeed * 0.45) * 0.5);
    vec2 center3 = vec2(0.5 + sin(time * uSpeed * 0.35) * 0.45, 0.5 + cos(time * uSpeed * 0.55) * 0.45);
    vec2 center4 = vec2(0.5 + cos(time * uSpeed * 0.5) * 0.4, 0.5 + sin(time * uSpeed * 0.4) * 0.4);
    vec2 center5 = vec2(0.5 + sin(time * uSpeed * 0.7) * 0.35, 0.5 + cos(time * uSpeed * 0.6) * 0.35);
    vec2 center6 = vec2(0.5 + cos(time * uSpeed * 0.45) * 0.5, 0.5 + sin(time * uSpeed * 0.65) * 0.5);
    vec2 center7 = vec2(0.5 + sin(time * uSpeed * 0.55) * 0.38, 0.5 + cos(time * uSpeed * 0.48) * 0.42);
    vec2 center8 = vec2(0.5 + cos(time * uSpeed * 0.65) * 0.36, 0.5 + sin(time * uSpeed * 0.52) * 0.44);
    vec2 center9 = vec2(0.5 + sin(time * uSpeed * 0.42) * 0.41, 0.5 + cos(time * uSpeed * 0.58) * 0.39);
    vec2 center10 = vec2(0.5 + cos(time * uSpeed * 0.48) * 0.37, 0.5 + sin(time * uSpeed * 0.62) * 0.43);
    vec2 center11 = vec2(0.5 + sin(time * uSpeed * 0.68) * 0.33, 0.5 + cos(time * uSpeed * 0.44) * 0.46);
    vec2 center12 = vec2(0.5 + cos(time * uSpeed * 0.38) * 0.39, 0.5 + sin(time * uSpeed * 0.56) * 0.41);

    float influence1 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center1));
    float influence2 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center2));
    float influence3 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center3));
    float influence4 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center4));
    float influence5 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center5));
    float influence6 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center6));
    float influence7 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center7));
    float influence8 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center8));
    float influence9 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center9));
    float influence10 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center10));
    float influence11 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center11));
    float influence12 = 1.0 - smoothstep(0.0, gradientRadius, length(uv - center12));

    vec2 rotatedUv1 = uv - 0.5;
    float angle1 = time * uSpeed * 0.15;
    rotatedUv1 = vec2(
      rotatedUv1.x * cos(angle1) - rotatedUv1.y * sin(angle1),
      rotatedUv1.x * sin(angle1) + rotatedUv1.y * cos(angle1)
    ) + 0.5;

    vec2 rotatedUv2 = uv - 0.5;
    float angle2 = -time * uSpeed * 0.12;
    rotatedUv2 = vec2(
      rotatedUv2.x * cos(angle2) - rotatedUv2.y * sin(angle2),
      rotatedUv2.x * sin(angle2) + rotatedUv2.y * cos(angle2)
    ) + 0.5;

    float radialInfluence1 = 1.0 - smoothstep(0.0, 0.8, length(rotatedUv1 - 0.5));
    float radialInfluence2 = 1.0 - smoothstep(0.0, 0.8, length(rotatedUv2 - 0.5));

    vec3 color = vec3(0.0);
    color += uColor1 * influence1 * (0.55 + 0.45 * sin(time * uSpeed)) * uColor1Weight;
    color += uColor2 * influence2 * (0.55 + 0.45 * cos(time * uSpeed * 1.2)) * uColor2Weight;
    color += uColor3 * influence3 * (0.55 + 0.45 * sin(time * uSpeed * 0.8)) * uColor1Weight;
    color += uColor4 * influence4 * (0.55 + 0.45 * cos(time * uSpeed * 1.3)) * uColor2Weight;
    color += uColor5 * influence5 * (0.55 + 0.45 * sin(time * uSpeed * 1.1)) * uColor1Weight;
    color += uColor6 * influence6 * (0.55 + 0.45 * cos(time * uSpeed * 0.9)) * uColor2Weight;

    if (uGradientCount > 6.0) {
      color += uColor1 * influence7 * (0.55 + 0.45 * sin(time * uSpeed * 1.4)) * uColor1Weight;
      color += uColor2 * influence8 * (0.55 + 0.45 * cos(time * uSpeed * 1.5)) * uColor2Weight;
      color += uColor3 * influence9 * (0.55 + 0.45 * sin(time * uSpeed * 1.6)) * uColor1Weight;
      color += uColor4 * influence10 * (0.55 + 0.45 * cos(time * uSpeed * 1.7)) * uColor2Weight;
    }
    if (uGradientCount > 10.0) {
      color += uColor5 * influence11 * (0.55 + 0.45 * sin(time * uSpeed * 1.8)) * uColor1Weight;
      color += uColor6 * influence12 * (0.55 + 0.45 * cos(time * uSpeed * 1.9)) * uColor2Weight;
    }

    color += mix(uColor1, uColor3, radialInfluence1) * 0.45 * uColor1Weight;
    color += mix(uColor2, uColor4, radialInfluence2) * 0.4 * uColor2Weight;

    color = clamp(color, vec3(0.0), vec3(1.0)) * uIntensity;

    float luminance = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(vec3(luminance), color, 1.35);
    color = pow(color, vec3(0.92));

    float brightness1 = length(color);
    float mixFactor1 = max(brightness1 * 1.2, 0.15);
    color = mix(uDarkNavy, color, mixFactor1);

    float maxBrightness = 1.0;
    float brightness = length(color);
    if (brightness > maxBrightness) {
      color = color * (maxBrightness / brightness);
    }

    return color;
  }

  void main() {
    vec2 uv = vUv;

    vec4 touchTex = texture2D(uTouchTexture, uv);
    float vx = -(touchTex.r * 2.0 - 1.0);
    float vy = -(touchTex.g * 2.0 - 1.0);
    float intensity = touchTex.b;
    uv.x += vx * 0.8 * intensity;
    uv.y += vy * 0.8 * intensity;

    vec2 center = vec2(0.5);
    float dist = length(uv - center);
    float ripple = sin(dist * 20.0 - uTime * 3.0) * 0.04 * intensity;
    float wave = sin(dist * 15.0 - uTime * 2.0) * 0.03 * intensity;
    uv += vec2(ripple + wave);

    vec3 color = getGradientColor(uv, uTime);

    float grainValue = grain(uv, uTime);
    color += grainValue * uGrainIntensity;

    float timeShift = uTime * 0.5;
    color.r += sin(timeShift) * 0.02;
    color.g += cos(timeShift * 1.4) * 0.02;
    color.b += sin(timeShift * 1.2) * 0.02;

    float brightness2 = length(color);
    float mixFactor2 = max(brightness2 * 1.2, 0.15);
    color = mix(uDarkNavy, color, mixFactor2);

    color = clamp(color, vec3(0.0), vec3(1.0));

    float maxBrightness = 1.0;
    float brightness = length(color);
    if (brightness > maxBrightness) {
      color = color * (maxBrightness / brightness);
    }

    gl_FragColor = vec4(color, 1.0);
  }
`;

function applySchemeUniforms(
  scheme: GradientScheme,
  uniforms: Record<string, { value: unknown }>,
  scene: THREE.Scene
) {
  const colors = COLOR_SCHEMES[scheme];

  const u = uniforms as {
    uColor1: { value: THREE.Vector3 };
    uColor2: { value: THREE.Vector3 };
    uColor3: { value: THREE.Vector3 };
    uColor4: { value: THREE.Vector3 };
    uColor5: { value: THREE.Vector3 };
    uColor6: { value: THREE.Vector3 };
    uSpeed: { value: number };
    uGradientSize: { value: number };
    uGradientCount: { value: number };
    uColor1Weight: { value: number };
    uColor2Weight: { value: number };
    uDarkNavy: { value: THREE.Vector3 };
  };

  if (scheme === 3) {
    u.uColor1.value.copy(colors.color1);
    u.uColor2.value.copy(colors.color2!);
    u.uColor3.value.copy(colors.color3!);
    u.uColor4.value.copy(colors.color1);
    u.uColor5.value.copy(colors.color2!);
    u.uColor6.value.copy(colors.color3!);
  } else if (scheme === 4) {
    u.uColor1.value.copy(colors.color1);
    u.uColor2.value.copy(colors.color2!);
    u.uColor3.value.copy(colors.color3!);
    u.uColor4.value.copy(colors.color1);
    u.uColor5.value.copy(colors.color2!);
    u.uColor6.value.copy(colors.color3!);
  } else if (scheme === 5) {
    u.uColor1.value.copy(colors.color1);
    u.uColor2.value.copy(colors.color2!);
    u.uColor3.value.copy(colors.color3!);
    u.uColor4.value.copy(colors.color4!);
    u.uColor5.value.copy(colors.color5!);
    u.uColor6.value.copy(colors.color6!);
  } else {
    u.uColor1.value.copy(colors.color1);
    u.uColor2.value.copy(colors.color2!);
    u.uColor3.value.copy(colors.color1);
    u.uColor4.value.copy(colors.color2!);
    u.uColor5.value.copy(colors.color1);
    u.uColor6.value.copy(colors.color2!);
  }

  if (scheme === 1 || scheme === 3 || scheme === 5) {
    scene.background = new THREE.Color(0x0a0e27);
    u.uDarkNavy.value.set(0.039, 0.055, 0.153);
    u.uGradientSize.value = 0.45;
    u.uGradientCount.value = 12.0;
    u.uSpeed.value = 0.45;
    u.uColor1Weight.value = 0.5;
    u.uColor2Weight.value = 1.8;
  } else if (scheme === 4) {
    scene.background = new THREE.Color(0xffffff);
    u.uDarkNavy.value.set(0, 0, 0);
    u.uGradientSize.value = 1.0;
    u.uGradientCount.value = 6.0;
    u.uSpeed.value = 0.35;
    u.uColor1Weight.value = 1.0;
    u.uColor2Weight.value = 1.0;
  } else {
    scene.background = new THREE.Color(0x0a0e27);
    u.uDarkNavy.value.set(0.039, 0.055, 0.153);
    u.uGradientSize.value = 1.0;
    u.uGradientCount.value = 6.0;
    u.uSpeed.value = 0.35;
    u.uColor1Weight.value = 1.0;
    u.uColor2Weight.value = 1.0;
  }
}

interface LiquidGradientBackgroundProps {
  scheme?: GradientScheme;
}

export function LiquidGradientBackground({ scheme = 1 }: LiquidGradientBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
      stencil: false,
      depth: false,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Camera + scene
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000);
    camera.position.z = 50;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e27);

    // Touch texture
    const touchSize = 64;
    const touchMaxAge = 64;
    const touchRadius = 0.25 * touchSize;
    const touchCanvas = document.createElement("canvas");
    touchCanvas.width = touchSize;
    touchCanvas.height = touchSize;
    const touchCtx = touchCanvas.getContext("2d")!;
    touchCtx.fillStyle = "black";
    touchCtx.fillRect(0, 0, touchSize, touchSize);
    const touchTexture = new THREE.Texture(touchCanvas);

    const trail: { x: number; y: number; age: number; force: number; vx: number; vy: number }[] = [];
    let lastTouch: { x: number; y: number } | null = null;

    const updateTouchTexture = () => {
      touchCtx.fillStyle = "black";
      touchCtx.fillRect(0, 0, touchSize, touchSize);

      for (let i = trail.length - 1; i >= 0; i--) {
        const point = trail[i];
        const speed = 1 / touchMaxAge;
        const f = point.force * speed * (1 - point.age / touchMaxAge);
        point.x += point.vx * f;
        point.y += point.vy * f;
        point.age++;

        if (point.age > touchMaxAge) {
          trail.splice(i, 1);
        } else {
          const pos = { x: point.x * touchSize, y: (1 - point.y) * touchSize };
          let intensity = 1;
          if (point.age < touchMaxAge * 0.3) {
            intensity = Math.sin((point.age / (touchMaxAge * 0.3)) * (Math.PI / 2));
          } else {
            const t = 1 - (point.age - touchMaxAge * 0.3) / (touchMaxAge * 0.7);
            intensity = -t * (t - 2);
          }
          intensity *= point.force;
          const color = `${((point.vx + 1) / 2) * 255}, ${((point.vy + 1) / 2) * 255}, ${intensity * 255}`;
          const offset = touchSize * 5;
          touchCtx.shadowOffsetX = offset;
          touchCtx.shadowOffsetY = offset;
          touchCtx.shadowBlur = touchRadius;
          touchCtx.shadowColor = `rgba(${color},${0.2 * intensity})`;
          touchCtx.beginPath();
          touchCtx.fillStyle = "rgba(255,0,0,1)";
          touchCtx.arc(pos.x - offset, pos.y - offset, touchRadius, 0, Math.PI * 2);
          touchCtx.fill();
        }
      }
      touchTexture.needsUpdate = true;
    };

    const addTouch = (point: { x: number; y: number }) => {
      let force = 0;
      let vx = 0;
      let vy = 0;
      if (lastTouch) {
        const dx = point.x - lastTouch.x;
        const dy = point.y - lastTouch.y;
        if (dx === 0 && dy === 0) return;
        const dd = dx * dx + dy * dy;
        const d = Math.sqrt(dd);
        vx = dx / d;
        vy = dy / d;
        force = Math.min(dd * 20000, 2.0);
      }
      lastTouch = { x: point.x, y: point.y };
      trail.push({ x: point.x, y: point.y, age: 0, force, vx, vy });
    };

    // Get view size
    const getViewSize = () => {
      const fovInRadians = (camera.fov * Math.PI) / 180;
      const height = Math.abs(camera.position.z * Math.tan(fovInRadians / 2) * 2);
      return { width: height * camera.aspect, height };
    };

    // Gradient mesh
    const viewSize = getViewSize();
    const geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1);

    const uniforms: Record<string, { value: unknown }> = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uColor1: { value: new THREE.Vector3(0.945, 0.353, 0.133) },
      uColor2: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
      uColor3: { value: new THREE.Vector3(0.945, 0.353, 0.133) },
      uColor4: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
      uColor5: { value: new THREE.Vector3(0.945, 0.353, 0.133) },
      uColor6: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
      uSpeed: { value: 0.35 },
      uIntensity: { value: 1.8 },
      uTouchTexture: { value: touchTexture },
      uGrainIntensity: { value: 0.08 },
      uDarkNavy: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
      uGradientSize: { value: 1.0 },
      uGradientCount: { value: 6.0 },
      uColor1Weight: { value: 1.0 },
      uColor2Weight: { value: 1.0 },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = 0;
    scene.add(mesh);

    applySchemeUniforms(scheme, uniforms, scene);

    // Animation
    const clock = new THREE.Clock();
    let animFrameId: number;

    const tick = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      (uniforms.uTime as { value: number }).value += delta;
      updateTouchTexture();
      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(tick);
    };

    tick();

    // Events
    const onMouseMove = (ev: MouseEvent) => {
      addTouch({ x: ev.clientX / window.innerWidth, y: 1 - ev.clientY / window.innerHeight });
    };

    const onTouchMove = (ev: TouchEvent) => {
      const touch = ev.touches[0];
      addTouch({ x: touch.clientX / window.innerWidth, y: 1 - touch.clientY / window.innerHeight });
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      const vs = getViewSize();
      mesh.geometry.dispose();
      mesh.geometry = new THREE.PlaneGeometry(vs.width, vs.height, 1, 1);
      (uniforms.uResolution as { value: THREE.Vector2 }).value.set(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      touchTexture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [scheme]);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}
