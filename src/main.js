import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createBoard } from './scene/createBoard.js?v=3fc8087';
import { SequenceController } from './animation/SequenceController.js';

const $ = (selector) => document.querySelector(selector);
const canvas = $('#scene'), viewport = $('.viewport'), status = $('#status');
const sceneState = $('#sceneState'), stateLabel = $('#stateLabel'), progressFill = $('#progressFill');
if (![canvas, viewport, status, sceneState, stateLabel, progressFill].every(Boolean)) throw new Error('Motherboard lab markup is incomplete.');

try {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#070b16');
  scene.fog = new THREE.FogExp2('#070b16', 0.022);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(11, 9, 12);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  const pixelRatio = () => Math.min(devicePixelRatio || 1, reduced.matches ? 1 : 1.6);
  renderer.setPixelRatio(pixelRatio());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = environment;
  pmrem.dispose();

  const controls = new OrbitControls(camera, canvas);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.055, enablePan: false, minDistance: 8, maxDistance: 23, autoRotate: !reduced.matches, autoRotateSpeed: 0.62 });
  controls.maxPolarAngle = Math.PI * 0.49;
  scene.add(new THREE.HemisphereLight('#a9d8ff', '#111226', 1.8));
  const key = new THREE.DirectionalLight('#d4edff', 3.2);
  key.position.set(5, 12, 7); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); scene.add(key);
  const cyan = new THREE.PointLight('#18cfff', 35, 22, 2); cyan.position.set(-7, 5, -4); scene.add(cyan);
  const violet = new THREE.PointLight('#9d55ff', 27, 18, 2); violet.position.set(6, 4, 5); scene.add(violet);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#080d1a', roughness: 0.9, metalness: 0.12 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.05; floor.receiveShadow = true; scene.add(floor);
  const grid = new THREE.GridHelper(80, 80, '#17445d', '#12243c'); grid.position.y = -1.035; scene.add(grid);

  const model = createBoard(); model.root.position.y = -0.12; scene.add(model.root);
  let seed = 0x5eed1234;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const positions = new Float32Array(650 * 3);
  for (let i = 0; i < 650; i += 1) { positions[i * 3] = (random() - 0.5) * 44; positions[i * 3 + 1] = random() * 18 - 2; positions[i * 3 + 2] = (random() - 0.5) * 44; }
  const starGeometry = new THREE.BufferGeometry(); starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: '#71dfff', size: 0.035, transparent: true, opacity: 0.58 })); scene.add(stars);
  const sequence = new SequenceController({ auto: !reduced.matches });
  let previous = 0, lastPhase = '', disposed = false;
  const labels = { idle: 'AUTO CYCLE / READY', explode: 'COMPONENTS / SEPARATING', hold: 'DIAGNOSTIC / INSPECTION', assemble: 'AUTO-RECOVERY / ALIGNING' };
  const messages = { idle: 'SYSTEM NOMINAL // READY FOR INSPECTION', explode: 'ASSEMBLY SEPARATING // CONTROLLED MOTION', hold: 'SUBSYSTEMS EXPOSED // SIGNAL PATHS VISIBLE', assemble: 'AUTO-RECOVERY // ALIGNING COMPONENTS' };
  const setPhase = (phase) => { if (phase !== lastPhase) { lastPhase = phase; sceneState.textContent = labels[phase]; status.textContent = messages[phase]; } };
  const resize = () => { const w = Math.max(1, viewport.clientWidth), h = Math.max(1, viewport.clientHeight); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const observer = new ResizeObserver(resize); observer.observe(viewport); resize();
  const onMotion = (event) => { sequence.auto = !event.matches; controls.autoRotate = !event.matches; renderer.setPixelRatio(pixelRatio()); };
  reduced.addEventListener('change', onMotion);
  $('#explodeBtn').addEventListener('click', () => sequence.explode());
  $('#assembleBtn').addEventListener('click', () => sequence.reassemble());
  $('#resetViewBtn').addEventListener('click', () => { camera.position.set(11, 9, 12); controls.target.set(0, 0, 0); controls.update(); });
  const onKey = (event) => { if (event.code === 'Space' && !event.repeat && !/^(INPUT|TEXTAREA|BUTTON)$/.test(event.target?.tagName || '')) { event.preventDefault(); sequence.progress > 0.5 ? sequence.reassemble() : sequence.explode(); } };
  addEventListener('keydown', onKey);
  function animate(time) {
    if (disposed) return;
    requestAnimationFrame(animate);
    const delta = Math.min(0.05, (time - previous) * 0.001 || 0.016), seconds = time * 0.001; previous = time;
    const { phase, progress } = sequence.update(delta); setPhase(phase);
    for (const part of model.parts) { const o = part.offset; part.group.position.set(part.origin.x + o.x * progress, part.origin.y + o.y * progress, part.origin.z + o.z * progress); part.group.rotation.x = Math.sin(progress * Math.PI) * part.accent * 0.035; part.group.rotation.z = Math.sin(progress * Math.PI * 2) * part.accent * 0.018; }
    for (const rotor of model.rotors) rotor.rotation.y = seconds * 3.4;
    model.pulseMaterials.forEach((material, i) => { material.emissiveIntensity = 1.7 + (Math.sin(seconds * 4 + i * 0.85) + 1) * 0.8; });
    stars.material.opacity = 0.48 + (Math.sin(seconds * 0.65) + 1) * 0.1; cyan.intensity = 31 + Math.sin(seconds * 1.3) * 4; violet.intensity = 25 + Math.cos(seconds * 1.1) * 4;
    progressFill.style.width = Math.round((1 - progress) * 100) + '%';
    stateLabel.textContent = progress < 0.015 ? 'LOCKED · 100%' : progress > 0.985 ? 'SEPARATED · 0%' : 'TRANSIT · ' + Math.round((1 - progress) * 100) + '%';
    controls.update(); renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);
  addEventListener('pagehide', () => { disposed = true; observer.disconnect(); reduced.removeEventListener('change', onMotion); removeEventListener('keydown', onKey); scene.traverse((object) => { if (object.isMesh) { object.geometry.dispose(); for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose(); } }); environment.dispose(); renderer.dispose(); }, { once: true });
} catch (error) { console.error('Motherboard lab initialization failed:', error); status.textContent = '3D INITIALIZATION FAILED // CHECK WEBGL SUPPORT'; throw error; }
