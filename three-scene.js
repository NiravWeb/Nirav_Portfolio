// three-scene.js — Three.js Star Field + Physics Spheres
// Uses THREE r128 loaded globally from CDN

// ─── Star Field (Hero Background) ────────────────────────────
function initStarField() {
  const canvas = document.getElementById('star-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 1;

  // Stars
  const starCount = 3000;
  const positions = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);
  const alphas = new Float32Array(starCount);

  for (let i = 0; i < starCount; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 20;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    sizes[i] = Math.random() * 2.5 + 0.5;
    alphas[i] = Math.random() * 0.8 + 0.2;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      mouseX: { value: 0 },
      mouseY: { value: 0 },
    },
    vertexShader: `
      attribute float size;
      attribute float alpha;
      varying float vAlpha;
      uniform float time;
      uniform float mouseX;
      uniform float mouseY;
      void main() {
        vAlpha = alpha;
        vec3 pos = position;
        pos.x += sin(time * 0.1 + pos.z * 2.0) * 0.02 + mouseX * 0.3;
        pos.y += cos(time * 0.08 + pos.x * 2.0) * 0.02 + mouseY * 0.3;
        vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (300.0 / -mvPos.z);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.0, d) * vAlpha;
        vec3 col = mix(vec3(0.0, 0.94, 1.0), vec3(0.61, 0.36, 0.9), d * 2.0);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const stars = new THREE.Points(geo, mat);
  scene.add(stars);

  // Mouse
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;
  document.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 0.5;
    targetY = (e.clientY / window.innerHeight - 0.5) * 0.5;
  });

  let frame = 0;
  function animate() {
    frame = requestAnimationFrame(animate);
    mat.uniforms.time.value += 0.016;
    mouseX += (targetX - mouseX) * 0.05;
    mouseY += (targetY - mouseY) * 0.05;
    mat.uniforms.mouseX.value = mouseX;
    mat.uniforms.mouseY.value = mouseY;
    stars.rotation.y += 0.0003;
    stars.rotation.x += 0.0001;
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Pause when hero not visible
  const observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) cancelAnimationFrame(frame);
    else animate();
  });
  observer.observe(document.getElementById('hero'));
}

// ─── Physics Spheres (About Section) ─────────────────────────
function initPhysicsSpheres() {
  const canvas = document.getElementById('physics-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, canvas.offsetWidth / canvas.offsetHeight, 0.1, 100);
  camera.position.z = 12;

  // Lighting
  const ambient = new THREE.AmbientLight(0x111133, 1.5);
  scene.add(ambient);

  const pointCyan = new THREE.PointLight(0x00f0ff, 3, 20);
  pointCyan.position.set(-5, 5, 5);
  scene.add(pointCyan);

  const pointPink = new THREE.PointLight(0xff2d9e, 3, 20);
  pointPink.position.set(5, -5, 5);
  scene.add(pointPink);

  // Spheres
  const sphereCount = 22;
  const spheres = [];
  const velocities = [];
  const radii = [];

  const glassGeo = new THREE.SphereGeometry(1, 32, 32);

  for (let i = 0; i < sphereCount; i++) {
    const r = Math.random() * 0.5 + 0.2;
    radii.push(r);

    const geo = new THREE.SphereGeometry(r, 24, 24);
    const hue = Math.random();
    const color = new THREE.Color().setHSL(hue, 0.9, 0.6);
    const mat = new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.85,
      thickness: 0.5,
      transparent: true,
      opacity: 0.7,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      (Math.random() - 0.5) * 14,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 4
    );
    scene.add(mesh);
    spheres.push(mesh);

    velocities.push({
      x: (Math.random() - 0.5) * 0.06,
      y: (Math.random() - 0.5) * 0.06,
      z: 0
    });
  }

  // Bounds
  const bx = 8, by = 5;

  // Mouse
  let mouseX = 0, mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
  });

  let raf = null;
  function animate() {
    raf = requestAnimationFrame(animate);

    for (let i = 0; i < sphereCount; i++) {
      const s = spheres[i];
      const v = velocities[i];
      const r = radii[i];

      // Mouse gravity
      const dx = mouseX * 6 - s.position.x;
      const dy = mouseY * 3 - s.position.y;
      v.x += dx * 0.0003;
      v.y += dy * 0.0003;

      s.position.x += v.x;
      s.position.y += v.y;

      // Damping
      v.x *= 0.998;
      v.y *= 0.998;

      // Bounce walls
      if (s.position.x > bx - r) { s.position.x = bx - r; v.x *= -0.85; }
      if (s.position.x < -bx + r) { s.position.x = -bx + r; v.x *= -0.85; }
      if (s.position.y > by - r) { s.position.y = by - r; v.y *= -0.85; }
      if (s.position.y < -by + r) { s.position.y = -by + r; v.y *= -0.85; }

      // Sphere-sphere collisions (simplified)
      for (let j = i + 1; j < sphereCount; j++) {
        const s2 = spheres[j];
        const v2 = velocities[j];
        const minDist = radii[i] + radii[j];
        const ex = s2.position.x - s.position.x;
        const ey = s2.position.y - s.position.y;
        const dist = Math.sqrt(ex * ex + ey * ey);
        if (dist < minDist && dist > 0) {
          const nx = ex / dist, ny = ey / dist;
          const relVx = v.x - v2.x, relVy = v.y - v2.y;
          const imp = (relVx * nx + relVy * ny) * 0.9;
          v.x -= imp * nx; v.y -= imp * ny;
          v2.x += imp * nx; v2.y += imp * ny;
          const overlap = (minDist - dist) * 0.5;
          s.position.x -= nx * overlap;
          s.position.y -= ny * overlap;
          s2.position.x += nx * overlap;
          s2.position.y += ny * overlap;
        }
      }

      s.rotation.x += 0.005;
      s.rotation.y += 0.007;
    }

    // Animate lights
    const t = Date.now() * 0.001;
    pointCyan.position.x = Math.sin(t * 0.5) * 6;
    pointCyan.position.y = Math.cos(t * 0.3) * 4;
    pointPink.position.x = Math.cos(t * 0.4) * 6;
    pointPink.position.y = Math.sin(t * 0.6) * 4;

    renderer.render(scene, camera);
  }

  // Only animate when visible
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      if (!raf) animate();
    } else {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }
  }, { threshold: 0.1 });
  observer.observe(document.getElementById('about'));

  window.addEventListener('resize', () => {
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
}

// Init when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initStarField();
    initPhysicsSpheres();
  });
} else {
  initStarField();
  initPhysicsSpheres();
}
