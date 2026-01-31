import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/* ------------------------------
   GLOBALS & CORE STATE
------------------------------ */
let renderer, scene, camera;
let clock = new THREE.Clock();
let player, playerMixer;
let controlsEnabled = false;
let currentMode = 'menu'; // 'menu' | 'play' | 'tutorial'
let terrainMesh;
let npcs = [];
let mixers = [];
let treesInstanced = [];
let raycaster = new THREE.Raycaster();
let pointer = new THREE.Vector2(0, 0);
let interactableNPC = null;

const canvas = document.getElementById('game');
const ui = {
  menu: document.getElementById('main-menu'),
  hud: document.getElementById('hud'),
  dialogue: document.getElementById('dialogue'),
  dialogueName: document.getElementById('dialogue-name'),
  dialogueText: document.getElementById('dialogue-text'),
  tutorialBox: document.getElementById('tutorial-box'),
  tutorialText: document.getElementById('tutorial-text'),
  location: document.getElementById('location'),
  hint: document.getElementById('hint')
};

const VOICES = {
  villager:  { voiceName: "Google UK English Male", pitch: 1.0, rate: 0.9 },
  merchant: { voiceName: "Google US English",     pitch: 1.1, rate: 1.0 },
  guard:    { voiceName: "Google UK English Female", pitch: 0.9, rate: 0.85 },
  assistant:{ voiceName: "Google US English",     pitch: 1.2, rate: 1.0 }
};

const state = {
  input: { forward:0, backward:0, left:0, right:0 },
  velocity: new THREE.Vector3(),
  cameraTarget: new THREE.Vector3(),
  cameraOffset: new THREE.Vector3(0, 4, -8),
  swayTime: 0
};

/* ------------------------------
   UTILS
------------------------------ */
function speak(text, profile) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = profile.pitch;
  utterance.rate = profile.rate;
  const voices = speechSynthesis.getVoices();
  utterance.voice = voices.find(v => v.name === profile.voiceName) || voices[0];
  speechSynthesis.speak(utterance);
}

function clamp(v, min, max){ return Math.min(Math.max(v, min), max); }

function perlinNoise(x, y) {
  // Simple hash-based noise (not perfect Perlin, but good enough)
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

/* ------------------------------
   INIT RENDERER, SCENE, CAMERA
------------------------------ */
initRenderer();
initScene();
initCamera();
initLights();
initSky();
initEvents();
loadWorld().then(() => {
  animate();
});

function initRenderer() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

function initScene() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x9eb3c6, 0.0022);
  const hemi = new THREE.HemisphereLight(0xdedede, 0x404040, 0.35);
  scene.add(hemi);
}

function initCamera() {
  camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 500);
  camera.position.set(0, 5, -10);
}

/* ------------------------------
   SKY & LIGHTING
------------------------------ */
function initSky() {
  const sky = new Sky();
  sky.scale.setScalar(5000);
  scene.add(sky);
  const sun = new THREE.Vector3();
  const phi = THREE.MathUtils.degToRad(88);
  const theta = THREE.MathUtils.degToRad(180);
  sun.setFromSphericalCoords(1, phi, theta);
  sky.material.uniforms['sunPosition'].value.copy(sun);

  // Directional sunlight
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(40, 80, 20);
  dirLight.castShadow = true;
  dirLight.shadow.bias = -0.00025;
  dirLight.shadow.mapSize.set(2048, 2048);
  dirLight.shadow.camera.left = -60;
  dirLight.shadow.camera.right = 60;
  dirLight.shadow.camera.top = 60;
  dirLight.shadow.camera.bottom = -60;
  scene.add(dirLight);
}

/* ------------------------------
   EVENTS
------------------------------ */
function initEvents() {
  window.addEventListener('resize', onResize);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', () => {
    if (!controlsEnabled && currentMode !== 'menu') {
      canvas.requestPointerLock();
    }
  });
  document.addEventListener('pointerlockchange', () => {
    controlsEnabled = document.pointerLockElement === canvas;
  });

  // Input keys
  const keyMap = {
    'KeyW':'forward', 'ArrowUp':'forward',
    'KeyS':'backward', 'ArrowDown':'backward',
    'KeyA':'left', 'ArrowLeft':'left',
    'KeyD':'right', 'ArrowRight':'right'
  };
  window.addEventListener('keydown', e => {
    if (keyMap[e.code] !== undefined) state.input[keyMap[e.code]] = 1;
    if (e.code === 'KeyE') tryInteract();
  });
  window.addEventListener('keyup', e => {
    if (keyMap[e.code] !== undefined) state.input[keyMap[e.code]] = 0;
  });

  // Menu buttons
  document.querySelectorAll('#main-menu button').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'play') startGame('play');
      if (action === 'tutorial') startGame('tutorial');
      if (action === 'customize') alert('Character customization placeholder - add your UI here!');
      if (action === 'settings') alert('Settings placeholder - add graphics/audio toggles here!');
    });
  });
}

/* ------------------------------
   LOAD WORLD
------------------------------ */
async function loadWorld() {
  await Promise.all([
    buildTerrain(),
    spawnBuildings(),
    spawnProps(),
    spawnTrees(),
    spawnNPCs(),
    spawnPlayer()
  ]);
}

/* ------------------------------
   TERRAIN (height-based, grass/dirt/path blend)
------------------------------ */
async function buildTerrain() {
  const size = 320;
  const divisions = 220;
  const geometry = new THREE.PlaneGeometry(size, size, divisions, divisions);
  geometry.rotateX(-Math.PI / 2);

  // Height map using noise
  const pos = geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = (perlinNoise(x * 0.05, z * 0.05) +
               perlinNoise(x * 0.1 + 100, z * 0.1 + 50) * 0.5) * 6;
    pos.setY(i, h);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();

  // Path mask in vertexColor.a: near z-axis we paint a path
  const colors = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const dist = Math.abs(z); // path along X axis
    const mask = clamp(1.0 - dist / 6.0, 0, 1);
    // store mask in vertex color alpha; rgb stays white
    colors.push(1,1,1, mask);
  }
  const colorAttr = new THREE.Float32BufferAttribute(colors, 4);
  geometry.setAttribute('color', colorAttr);

  const texLoader = new THREE.TextureLoader();
  const grass = texLoader.load('assets/textures/grass.jpg');
  const dirt  = texLoader.load('assets/textures/dirt.jpg');
  const path  = texLoader.load('assets/textures/path.jpg');
  [grass, dirt, path].forEach(t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(16,16); t.anisotropy = 4; });

  // Custom shader to blend grass/dirt/path by height and vertex alpha
  const material = new THREE.MeshStandardMaterial({
    map: grass,
    onBeforeCompile: shader => {
      shader.uniforms.dirtMap = { value: dirt };
      shader.uniforms.pathMap = { value: path };
      shader.uniforms.uvScale = { value: new THREE.Vector2(1,1) };
      shader.vertexShader = shader.vertexShader.replace(
        '#include <color_vertex>',
        `
        #include <color_vertex>
        vColor = color;
        `
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        vec4 grassColor = texture2D(map, vUv);
        vec4 dirtColor  = texture2D(dirtMap, vUv * 1.2);
        vec4 pathColor  = texture2D(pathMap, vUv * 1.0);
        // Blend by height: higher = more grass, lower = more dirt
        float h = vViewPosition.y * -0.02; // view position y is negative
        float dirtMix = clamp(h, 0.0, 1.0);
        float grassMix = 1.0 - dirtMix;
        float pathMask = vColor.a; // from vertex color alpha
        vec4 base = mix(dirtColor, grassColor, grassMix);
        base = mix(base, pathColor, pathMask);
        diffuseColor = base;
        `
      );
    },
    vertexColors: true,
    roughness: 1.0,
    metalness: 0.0
  });

  terrainMesh = new THREE.Mesh(geometry, material);
  terrainMesh.receiveShadow = true;
  scene.add(terrainMesh);
}

/* ------------------------------
   BUILDINGS (gate, courtyard, library, player house)
------------------------------ */
async function spawnBuildings() {
  const loader = makeLoader();
  const place = (gltf, pos, rotY=0, scale=1) => {
    const mesh = gltf.scene;
    mesh.position.copy(pos);
    mesh.rotation.y = rotY;
    mesh.scale.setScalar(scale);
    mesh.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
    scene.add(mesh);
  };

  const gate = await loadGLB(loader, 'assets/models/buildings/gatehouse.glb');
  place(gate, new THREE.Vector3(0, terrainHeightAt(0, -40), -40), Math.PI, 1.4);

  const house = await loadGLB(loader, 'assets/models/buildings/stone_house.glb');
  place(house, new THREE.Vector3(18, terrainHeightAt(18, 12), 12), Math.PI/2, 1.2);

  const playerHouse = await loadGLB(loader, 'assets/models/buildings/player_house.glb');
  place(playerHouse, new THREE.Vector3(-22, terrainHeightAt(-22, 8), 8), -Math.PI/3, 1.0);

  const library = await loadGLB(loader, 'assets/models/buildings/library.glb');
  place(library, new THREE.Vector3(-8, terrainHeightAt(-8, 35), 35), 0, 1.4);
}

/* ------------------------------
   PROPS
------------------------------ */
async function spawnProps() {
  const loader = makeLoader();
  const barrel = await loadGLB(loader, 'assets/models/props/barrel.glb');
  const positions = [
    [3, -2], [5, -1], [7, 0], [9, -3]
  ];
  positions.forEach(([x,z]) => {
    const obj = barrel.scene.clone(true);
    obj.position.set(x, terrainHeightAt(x,z), z);
    obj.scale.setScalar(0.9);
    obj.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; } });
    scene.add(obj);
  });
}

/* ------------------------------
   TREES (instanced)
------------------------------ */
async function spawnTrees() {
  const loader = makeLoader();
  const gltf = await loadGLB(loader, 'assets/models/nature/tree.glb');
  // Build instanced meshes per material
  const meshes = [];
  gltf.scene.traverse(o => { if (o.isMesh) meshes.push(o); });
  if (!meshes.length) return;

  meshes.forEach(mesh => {
    const count = 150;
    const inst = new THREE.InstancedMesh(mesh.geometry, mesh.material, count);
    inst.castShadow = true;
    inst.receiveShadow = true;
    const dummy = new THREE.Object3D();
    for (let i=0;i<count;i++) {
      const x = THREE.MathUtils.randFloatSpread(260);
      const z = THREE.MathUtils.randFloatSpread(260);
      const y = terrainHeightAt(x,z);
      dummy.position.set(x, y, z);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      const s = 0.9 + Math.random()*0.6;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    treesInstanced.push(inst);
    scene.add(inst);
  });
}

/* ------------------------------
   NPCs
------------------------------ */
async function spawnNPCs() {
  const loader = makeLoader();
  const npcDefs = [
    { file:'villager01.glb', pos:new THREE.Vector3(2, terrainHeightAt(2,2), 2), role:'villager', name:'Alder', text:'Welcome to Kingdom Furi. Paths are muddy today.' },
    { file:'merchant.glb', pos:new THREE.Vector3(10, terrainHeightAt(10,-4), -4), role:'merchant', name:'Mara', text:'Need supplies? I have what coin can buy.' },
    { file:'guard.glb', pos:new THREE.Vector3(-5, terrainHeightAt(-5,-8), -8), role:'guard', name:'Guard', text:'Stay out of trouble. The king watches all.' }
  ];

  for (const def of npcDefs) {
    const gltf = await loadGLB(loader, `assets/models/characters/${def.file}`);
    const npc = gltf.scene;
    npc.position.copy(def.pos);
    npc.scale.setScalar(1);
    npc.traverse(o => {
      if (o.isMesh) { 
        o.castShadow = o.receiveShadow = true; 
        if (/eye/i.test(o.name)) o.visible = false; // remove eyes
      }
    });
    scene.add(npc);

    // Animation
    const mixer = new THREE.AnimationMixer(npc);
    const idle = THREE.AnimationClip.findByName(gltf.animations, 'Idle') || gltf.animations[0];
    if (idle) mixer.clipAction(idle).play();

    npcs.push({ npc, mixer, def });
    mixers.push(mixer);
  }
}

/* ------------------------------
   PLAYER
------------------------------ */
async function spawnPlayer() {
  const loader = makeLoader();
  const gltf = await loadGLB(loader, 'assets/models/characters/villager01.glb');
  player = gltf.scene;
  player.position.set(0, terrainHeightAt(0,0), 0);
  player.scale.setScalar(1);
  player.traverse(o => {
    if (o.isMesh) {
      o.castShadow = o.receiveShadow = true;
      if (/eye/i.test(o.name)) o.visible = false;
    }
  });
  scene.add(player);

  playerMixer = new THREE.AnimationMixer(player);
  const idle = THREE.AnimationClip.findByName(gltf.animations, 'Idle') || gltf.animations[0];
  if (idle) playerMixer.clipAction(idle).play();
  mixers.push(playerMixer);
}

/* ------------------------------
   LOADER HELPERS
------------------------------ */
function makeLoader() {
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
  loader.setDRACOLoader(draco);
  return loader;
}
function loadGLB(loader, url) {
  return new Promise((resolve, reject) => {
    loader.load(url, gltf => resolve(gltf), undefined, reject);
  });
}

/* ------------------------------
   MOVEMENT & CAMERA
------------------------------ */
function updatePlayer(dt) {
  if (!player) return;
  const speed = 6.5;
  const dir = new THREE.Vector3(
    state.input.right - state.input.left,
    0,
    state.input.backward - state.input.forward
  );
  // Camera-relative movement
  const camDir = new THREE.Vector3();
  camera.getWorldDirection(camDir);
  camDir.y = 0; camDir.normalize();
  const camRight = new THREE.Vector3().crossVectors(camDir, new THREE.Vector3(0,1,0)).normalize();

  const move = new THREE.Vector3();
  move.addScaledVector(camDir, -dir.z);
  move.addScaledVector(camRight, dir.x);
  if (move.lengthSq() > 0) {
    move.normalize();
    player.position.addScaledVector(move, speed * dt);
    // Face move direction
    const targetRot = Math.atan2(move.x, move.z);
    player.rotation.y = THREE.MathUtils.lerp(player.rotation.y, targetRot, 0.25);
    state.swayTime += dt * 6;
  } else {
    state.swayTime = THREE.MathUtils.lerp(state.swayTime, 0, 0.1);
  }

  // Keep on terrain
  const y = terrainHeightAt(player.position.x, player.position.z);
  player.position.y = y;

  // Camera follow with slight sway
  const sway = Math.sin(state.swayTime) * 0.15;
  const desiredOffset = new THREE.Vector3(0.8 * sway, 4 + 0.2*Math.abs(sway), -8);
  state.cameraOffset.lerp(desiredOffset, 0.2);

  const camTarget = new THREE.Vector3().copy(player.position);
  camTarget.y += 1.6;
  state.cameraTarget.lerp(camTarget, 0.15);

  const behind = new THREE.Vector3(0,0,-1).applyQuaternion(player.quaternion);
  const desiredCamPos = new THREE.Vector3().copy(state.cameraTarget).addScaledVector(behind, -state.cameraOffset.z);
  desiredCamPos.y += state.cameraOffset.y;
  camera.position.lerp(desiredCamPos, 0.12);
  camera.lookAt(state.cameraTarget);
}

/* ------------------------------
   TERRAIN HEIGHT SAMPLER
------------------------------ */
function terrainHeightAt(x, z) {
  // Mirror of the noise used in buildTerrain
  const h = (perlinNoise(x * 0.05, z * 0.05) +
             perlinNoise(x * 0.1 + 100, z * 0.1 + 50) * 0.5) * 6;
  return h;
}

/* ------------------------------
   NPC INTERACTION
------------------------------ */
function onMouseMove(e) {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
}

function tryInteract() {
  if (!interactableNPC) return;
  const { def } = interactableNPC;
  showDialogue(def.name, def.text);
  speak(def.text, VOICES[def.role] || VOICES.villager);

  // Story beats (placeholder progression)
  if (currentMode === 'play' && def.role === 'villager') {
    ui.location.textContent = 'Location: Courtyard';
  }
  if (currentMode === 'tutorial') {
    ui.tutorialText.textContent = 'Great! You spoke to an NPC. Training dummy sparring next (placeholder).';
  }
}

function showDialogue(name, text) {
  ui.dialogue.classList.remove('hidden');
  ui.dialogueName.textContent = name;
  ui.dialogueText.textContent = text;
  setTimeout(() => ui.dialogue.classList.add('hidden'), 4000);
}

/* ------------------------------
   UPDATE LOOP
------------------------------ */
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  mixers.forEach(m => m.update(dt));

  if (currentMode !== 'menu') {
    updatePlayer(dt);
    detectNPC();
  }
  renderer.render(scene, camera);
}

function detectNPC() {
  // Raycast center of screen
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(npcs.map(n => n.npc), true);
  const nearest = hits.length ? npcs.find(n => hits[0].object.parent && n.npc === hits[0].object.parent || n.npc === hits[0].object) : null;
  if (nearest) {
    interactableNPC = nearest;
    ui.hint.textContent = 'E: Talk to ' + nearest.def.name;
  } else {
    interactableNPC = null;
    ui.hint.textContent = 'WASD: Move | Mouse: Look | E: Interact';
  }
}

/* ------------------------------
   MODES
------------------------------ */
function startGame(mode) {
  currentMode = mode;
  ui.menu.classList.add('hidden');
  ui.hud.classList.remove('hidden');
  if (mode === 'tutorial') {
    ui.tutorialBox.classList.remove('hidden');
    ui.tutorialText.textContent = 'Learn to move: press WASD.';
    ui.location.textContent = 'Location: Training Field';
  } else {
    ui.tutorialBox.classList.add('hidden');
    ui.location.textContent = 'Location: Kingdom Gate';
  }
  canvas.requestPointerLock();
}

/* ------------------------------
   RESIZE
------------------------------ */
function onResize() {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
