/**
 * SACRED THREE.JS UNIFIED ENGINE — CATA ARANGO · TRASCENDAMOS JUNTOS
 * Features:
 * 1. Hero Celestial Experience: Sacred Torus Knot, Armillary Gyroscope, Dynamic Mouse Light & Stardust.
 * 2. Pricing Sacred Experience: Dual Icosahedron / Octahedron with Card-Hover Reaction.
 * 3. 60 FPS, silky smooth lerping, IntersectionObserver optimization (0% CPU when off-screen).
 * 4. Pointer-events: none — zero interference with links, buttons, or forms.
 */

(function () {
  'use strict';

  function initThreeEngine() {
    if (typeof THREE === 'undefined') {
      setTimeout(initThreeEngine, 100);
      return;
    }

    initHeroExperience();
    initPricingExperience();
  }

  // =========================================================================
  // 1. HERO CELESTIAL THREE.JS EXPERIENCE
  // =========================================================================
  function initHeroExperience() {
    const hero = document.querySelector('.hero-mystic');
    if (!hero) return;

    let width = hero.clientWidth || window.innerWidth;
    let height = hero.clientHeight || 520;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 24;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.className = 'hero-three-canvas';
    hero.insertBefore(canvas, hero.firstChild);

    // Celestial Pivot
    const celestialGroup = new THREE.Group();
    scene.add(celestialGroup);
    celestialGroup.position.set(0, 0, -2);

    // A. Sacred Torus Knot (Golden Geometric Mesh)
    const knotGeom = new THREE.TorusKnotGeometry(3.6, 0.75, 100, 16, 2, 3);
    const knotWire = new THREE.WireframeGeometry(knotGeom);
    const knotMat = new THREE.LineBasicMaterial({
      color: 0xe5c392,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending
    });
    const knotMesh = new THREE.LineSegments(knotWire, knotMat);
    celestialGroup.add(knotMesh);

    // B. Armillary Rings (Concentric Gyroscopic Sacred Rings)
    const ringMatGold = new THREE.LineBasicMaterial({
      color: 0xf7d598,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const ringMatSage = new THREE.LineBasicMaterial({
      color: 0x748873,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending
    });

    const ringGeom1 = new THREE.RingGeometry(5.2, 5.25, 64);
    const ring1 = new THREE.LineLoop(ringGeom1, ringMatGold);
    ring1.rotation.x = Math.PI / 3;
    celestialGroup.add(ring1);

    const ringGeom2 = new THREE.RingGeometry(4.6, 4.65, 64);
    const ring2 = new THREE.LineLoop(ringGeom2, ringMatSage);
    ring2.rotation.y = Math.PI / 4;
    celestialGroup.add(ring2);

    const ringGeom3 = new THREE.RingGeometry(4.0, 4.05, 64);
    const ring3 = new THREE.LineLoop(ringGeom3, ringMatGold);
    ring3.rotation.z = Math.PI / 6;
    celestialGroup.add(ring3);

    // C. Ethereal Stardust Particles
    const pCount = 750;
    const pPositions = new Float32Array(pCount * 3);
    const pColors = new Float32Array(pCount * 3);
    const basePositions = [];

    const goldColor = new THREE.Color(0xf7d598);
    const sageColor = new THREE.Color(0xb7ccb5);
    const whiteColor = new THREE.Color(0xfff9e8);

    for (let i = 0; i < pCount; i++) {
      const radius = 5 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta) * 0.75;
      const z = radius * Math.cos(phi) * 0.7;

      pPositions[i * 3] = x;
      pPositions[i * 3 + 1] = y;
      pPositions[i * 3 + 2] = z;

      basePositions.push({ x, y, z, phase: Math.random() * Math.PI * 2, speed: 0.5 + Math.random() * 0.8 });

      const rnd = Math.random();
      const col = rnd > 0.55 ? goldColor : (rnd > 0.2 ? sageColor : whiteColor);
      pColors[i * 3] = col.r;
      pColors[i * 3 + 1] = col.g;
      pColors[i * 3 + 2] = col.b;
    }

    const pGeom = new THREE.BufferGeometry();
    pGeom.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeom.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    // Circle particle canvas
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d');
    const radGrad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    radGrad.addColorStop(0, 'rgba(255,255,255,1)');
    radGrad.addColorStop(0.35, 'rgba(247,213,152,0.85)');
    radGrad.addColorStop(1, 'rgba(247,213,152,0)');
    pCtx.fillStyle = radGrad;
    pCtx.beginPath();
    pCtx.arc(16, 16, 16, 0, Math.PI * 2);
    pCtx.fill();

    const pTexture = new THREE.CanvasTexture(pCanvas);
    const pMaterial = new THREE.PointsMaterial({
      size: 0.52,
      map: pTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(pGeom, pMaterial);
    scene.add(particles);

    // Mouse Tracking & Inertia
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    function onPointerMove(e) {
      const rect = hero.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      targetX = ((clientX - rect.left) / rect.width) * 2 - 1;
      targetY = -(((clientY - rect.top) / rect.height) * 2 - 1);
    }

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });

    // Resize
    function onResize() {
      if (!hero) return;
      width = hero.clientWidth || window.innerWidth;
      height = hero.clientHeight || 520;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    window.addEventListener('resize', onResize, { passive: true });

    // Visibility Observer
    let isVisible = true;
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { isVisible = entry.isIntersecting; });
      }, { threshold: 0.05 });
      observer.observe(hero);
    }

    // Animation Loop
    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsed = clock.getElapsedTime();

      // Smooth Lerping
      mouseX += (targetX - mouseX) * 0.04;
      mouseY += (targetY - mouseY) * 0.04;

      // Group Dynamic Rotation
      celestialGroup.rotation.y = elapsed * 0.1 + mouseX * 0.75;
      celestialGroup.rotation.x = Math.sin(elapsed * 0.08) * 0.15 - mouseY * 0.5;
      celestialGroup.rotation.z = Math.cos(elapsed * 0.06) * 0.12;

      // Independent Armillary Gyroscope Rotation
      ring1.rotation.y += 0.006;
      ring2.rotation.x += 0.008;
      ring3.rotation.z += 0.007;

      // Subtle Breathing Scale
      const breathe = 1 + Math.sin(elapsed * 0.8) * 0.04;
      celestialGroup.scale.set(breathe, breathe, breathe);

      // Starfield Rotation & Wave
      particles.rotation.y = elapsed * 0.035 + mouseX * 0.3;
      particles.rotation.x = Math.sin(elapsed * 0.05) * 0.08 - mouseY * 0.2;

      // Luminous Pulse
      knotMat.opacity = 0.20 + Math.sin(elapsed * 1.1) * 0.07;
      ringMatGold.opacity = 0.28 + Math.cos(elapsed * 1.3) * 0.08;

      renderer.render(scene, camera);
    }

    animate();
  }

  // =========================================================================
  // 2. PRICING SACRED EXPERIENCE (Icosahedron & Octahedron Core)
  // =========================================================================
  function initPricingExperience() {
    const container = document.getElementById('sacredThreeContainer');
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 650;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 28;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.className = 'sacred-three-canvas';
    container.insertBefore(canvas, container.firstChild);

    // Sacred Geometry Group
    const sacredGroup = new THREE.Group();
    scene.add(sacredGroup);

    // Outer Golden Icosahedron
    const icoGeom = new THREE.IcosahedronGeometry(7.5, 1);
    const icoWire = new THREE.WireframeGeometry(icoGeom);
    const icoMat = new THREE.LineBasicMaterial({
      color: 0xe5c392,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending
    });
    const icoMesh = new THREE.LineSegments(icoWire, icoMat);
    sacredGroup.add(icoMesh);

    // Inner Emerald Octahedron
    const octaGeom = new THREE.OctahedronGeometry(4.2, 0);
    const octaWire = new THREE.WireframeGeometry(octaGeom);
    const octaMat = new THREE.LineBasicMaterial({
      color: 0x748873,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending
    });
    const octaMesh = new THREE.LineSegments(octaWire, octaMat);
    sacredGroup.add(octaMesh);

    // Luminous Core
    const coreGeom = new THREE.SphereGeometry(0.35, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xf7d598,
      transparent: true,
      opacity: 0.75
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    sacredGroup.add(coreMesh);

    // Starfield
    const particleCount = 650;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colorGold = new THREE.Color(0xf7d598);
    const colorSage = new THREE.Color(0xb7ccb5);
    const colorWhite = new THREE.Color(0xfff9e8);

    for (let i = 0; i < particleCount; i++) {
      const radius = 6 + Math.random() * 22;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.7;
      particlePositions[i * 3 + 2] = radius * Math.cos(phi) * 0.6;

      const rChoice = Math.random();
      const chosenColor = rChoice > 0.6 ? colorGold : (rChoice > 0.25 ? colorSage : colorWhite);
      particleColors[i * 3] = chosenColor.r;
      particleColors[i * 3 + 1] = chosenColor.g;
      particleColors[i * 3 + 2] = chosenColor.b;
    }

    const particleGeom = new THREE.BufferGeometry();
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d');
    const grad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(247,213,152,0.85)');
    grad.addColorStop(1, 'rgba(247,213,152,0)');
    pCtx.fillStyle = grad;
    pCtx.beginPath();
    pCtx.arc(16, 16, 16, 0, Math.PI * 2);
    pCtx.fill();

    const pTexture = new THREE.CanvasTexture(pCanvas);
    const pMat = new THREE.PointsMaterial({
      size: 0.55,
      map: pTexture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particleSystem = new THREE.Points(particleGeom, pMat);
    scene.add(particleSystem);

    // Mouse Tracking & Card Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    let isHoveringCard = false;
    let hoverEnergy = 1.0;

    function onPointerMove(e) {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;

      targetX = ((clientX - rect.left) / rect.width) * 2 - 1;
      targetY = -(((clientY - rect.top) / rect.height) * 2 - 1);
    }

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });

    const cards = container.querySelectorAll('.pricing-card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => { isHoveringCard = true; });
      card.addEventListener('mouseleave', () => { isHoveringCard = false; });
    });

    function onResize() {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || 650;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    window.addEventListener('resize', onResize, { passive: true });

    let isVisible = true;
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { isVisible = entry.isIntersecting; });
      }, { threshold: 0.05 });
      observer.observe(container);
    }

    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      if (!isVisible) return;

      const elapsedTime = clock.getElapsedTime();

      mouseX += (targetX - mouseX) * 0.045;
      mouseY += (targetY - mouseY) * 0.045;

      const targetEnergy = isHoveringCard ? 1.85 : 1.0;
      hoverEnergy += (targetEnergy - hoverEnergy) * 0.05;

      sacredGroup.rotation.y = elapsedTime * 0.12 * hoverEnergy + mouseX * 0.8;
      sacredGroup.rotation.x = Math.sin(elapsedTime * 0.08) * 0.15 - mouseY * 0.6;
      sacredGroup.rotation.z = Math.cos(elapsedTime * 0.06) * 0.1;

      octaMesh.rotation.y = -elapsedTime * 0.22 * hoverEnergy;
      octaMesh.rotation.x = elapsedTime * 0.15;

      const breathe = 1 + Math.sin(elapsedTime * 0.75) * 0.04;
      sacredGroup.scale.set(breathe, breathe, breathe);

      particleSystem.rotation.y = elapsedTime * 0.035 * hoverEnergy;
      particleSystem.rotation.x = Math.sin(elapsedTime * 0.04) * 0.05;

      icoMat.opacity = 0.18 + Math.sin(elapsedTime * 1.2) * 0.06 * hoverEnergy;
      octaMat.opacity = 0.28 + Math.cos(elapsedTime * 1.5) * 0.08 * hoverEnergy;

      renderer.render(scene, camera);
    }

    animate();
  }

  // Self-boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThreeEngine);
  } else {
    initThreeEngine();
  }
})();
