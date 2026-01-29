// Global variables
let scene, camera, renderer, player, clock;
let keys = {};
let npcs = [];
let isLoading = false;
let currentDialogue = null;

// Voice profiles
const VOICES = {
    villager:  { voiceName: "Google UK English Male", pitch: 1.0, rate: 0.9 },
    merchant: { voiceName: "Google US English",     pitch: 1.1, rate: 1.0 },
    guard:    { voiceName: "Google UK English Female", pitch: 0.9, rate: 0.85 },
    assistant:{ voiceName: "Google US English",     pitch: 1.2, rate: 1.0 }
};

// Initialize game
function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x87CEEB, 10, 100);
    
    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 15);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x87CEEB);

    // Lighting
    const directionalLight = new THREE.DirectionalLight(0xFFFFE0, 1.5);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    // Clock
    clock = new THREE.Clock();

    // Load environment
    loadEnvironment();

    // Event listeners
    window.addEventListener('keydown', (e) => keys[e.code] = true);
    window.addEventListener('keyup', (e) => keys[e.code] = false);
    window.addEventListener('click', onMouseClick);
    window.addEventListener('resize', onWindowResize);
}

// Load environment
function loadEnvironment() {
    // Generate terrain
    const terrainGeometry = new THREE.PlaneGeometry(100, 100, 100, 100);
    const simplex = new SimplexNoise(Math.random());
    
    terrainGeometry.vertices.forEach((vertex, index) => {
        const x = (index % 101) / 10;
        const y = Math.floor(index / 101) / 10;
        vertex.z = simplex.noise2D(x / 3, y / 3) * 3;
    });
    
    terrainGeometry.computeVertexNormals();
    
    const terrainMaterial = new THREE.MeshLambertMaterial({ 
        map: loadTexture('https://assets.codepen.io/5005380/grass-texture.jpg') 
    });
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Create path
    const pathMaterial = new THREE.MeshLambertMaterial({ 
        map: loadTexture('https://assets.codepen.io/5005380/dirt-path.jpg') 
    });
    const pathGeometry = new THREE.PlaneGeometry(10, 100);
    const path = new THREE.Mesh(pathGeometry, pathMaterial);
    path.position.y = 0.1;
    path.rotation.x = -Math.PI / 2;
    path.receiveShadow = true;
    scene.add(path);

    // Load trees
    loadTrees();
    
    // Load buildings
    loadBuildings();
    
    // Load NPCs
    loadNPCs();
}

// Load trees using instancing
function loadTrees() {
    const treeLoader = new THREE.GLTFLoader();
    const treePositions = [];
    
    // Generate random tree positions
    for (let i = 0; i < 50; i++) {
        treePositions.push({
            x: (Math.random() - 0.5) * 80,
            z: (Math.random() - 0.5) * 80,
            scale: 0.5 + Math.random() * 1.5
        });
    }
    
    treeLoader.load('https://cdn.glitch.global/3d-assets/medieval-tree.glb?v=1', (gltf) => {
        const treeModel = gltf.scene.children[0];
        treeModel.castShadow = true;
        
        const matrix = new THREE.Matrix4();
        const instancedMesh = new THREE.InstancedMesh(treeModel.geometry, treeModel.material, 50);
        
        treePositions.forEach((pos, index) => {
            matrix.setPosition(pos.x, 0, pos.z);
            matrix.scale(new THREE.Vector3(pos.scale, pos.scale, pos.scale));
            instancedMesh.setMatrixAt(index, matrix);
        });
        
        scene.add(instancedMesh);
    });
}

// Load buildings
function loadBuildings() {
    const loader = new THREE.GLTFLoader();
    
    // Kingdom gate
    loader.load('https://cdn.glitch.global/3d-assets/kingdom-gate.glb?v=1', (gltf) => {
        const gate = gltf.scene;
        gate.position.set(0, 0, -40);
        gate.scale.set(2, 2, 2);
        gate.castShadow = true;
        gate.traverse(child => {
            if (child.isMesh) child.receiveShadow = true;
        });
        scene.add(gate);
    });
    
    // Player house
    loader.load('https://cdn.glitch.global/3d-assets/medieval-house.glb?v=1', (gltf) => {
        const house = gltf.scene;
        house.position.set(-20, 0, 10);
        house.scale.set(1.5, 1.5, 1.5);
        house.castShadow = true;
        house.traverse(child => {
            if (child.isMesh) child.receiveShadow = true;
        });
        scene.add(house);
    });
}

// Load NPCs
function loadNPCs() {
    const loader = new THREE.GLTFLoader();
    
    // Assistant NPC
    loader.load('https://cdn.glitch.global/3d-assets/villager.glb?v=1', (gltf) => {
        const npc = gltf.scene;
        npc.position.set(10, 0, 5);
        npc.scale.set(1, 1, 1);
        
        // Remove eyes
        npc.traverse(obj => {
            if (obj.isMesh && /eye/i.test(obj.name)) {
                obj.visible = false;
            }
        });
        
        npc.castShadow = true;
        npc.traverse(child => {
            if (child.isMesh) child.receiveShadow = true;
        });
        
        scene.add(npc);
        npcs.push({ npc, type: 'assistant', dialogue: "Welcome to Kingdom Furi! I'm here to help you get settled. Your house is just over there." });
    });
    
    // Merchant NPC
    loader.load('https://cdn.glitch.global/3d-assets/merchant.glb?v=1', (gltf) => {
        const npc = gltf.scene;
        npc.position.set(15, 0, -10);
        npc.scale.set(1, 1, 1);
        
        npc.traverse(obj => {
            if (obj.isMesh && /eye/i.test(obj.name)) {
                obj.visible = false;
            }
        });
        
        npc.castShadow = true;
        npc.traverse(child => {
            if (child.isMesh) child.receiveShadow = true;
        });
        
        scene.add(npc);
        npcs.push({ npc, type: 'merchant', dialogue: "Fresh bread and supplies! Come see what I have for sale." });
    });
}

// Load texture with wrapping
function loadTexture(url) {
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(url);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
}

// Start game
function startGame() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('healthBar').style.display = 'block';
    
    // Create player
    const playerGeometry = new THREE.CapsuleGeometry(0.5, 2, 4, 8);
    const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(0, 1, 10);
    player.castShadow = true;
    scene.add(player);
    
    animate();
}

// Animate loop
function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    
    // Player movement
    if (player) {
        const moveSpeed = 5;
        if (keys['KeyW']) player.position.z -= moveSpeed * delta;
        if (keys['KeyS']) player.position.z += moveSpeed * delta;
        if (keys['KeyA']) player.position.x -= moveSpeed * delta;
        if (keys['KeyD']) player.position.x += moveSpeed * delta;
        
        // Keep player on terrain
        player.position.y = 1;
        
        // Update camera to follow player
        camera.position.x = player.position.x;
        camera.position.z = player.position.z + 15;
        camera.position.y = player.position.y + 5;
        camera.lookAt(player.position);
    }
    
    // Update NPC animations
    npcs.forEach(({ npc, mixer }) => {
        if (mixer) mixer.update(delta);
    });
    
    renderer.render(scene, camera);
}

// Mouse click for interaction
function onMouseClick(event) {
    if (!player || isLoading) return;
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(npcs.map(n => n.npc));
    
    if (intersects.length > 0) {
        const npc = npcs.find(n => n.npc === intersects[0].object);
        if (npc && !isLoading) {
            interactWithNPC(npc);
        }
    }
}

// Interact with NPC
function interactWithNPC(npc) {
    isLoading = true;
    document.getElementById('dialogueBox').style.display = 'block';
    document.getElementById('dialogueBox').textContent = npc.dialogue;
    
    speak(npc.dialogue, VOICES[npc.type]);
    
    setTimeout(() => {
        document.getElementById('dialogueBox').style.display = 'none';
        isLoading = false;
    }, 3000);
}

// Text-to-speech
function speak(text, profile) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = profile.pitch;
    utterance.rate = profile.rate;
    
    const voices = speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.name === profile.voiceName) || voices[0];
    
    speechSynthesis.speak(utterance);
}

// Window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start tutorial
function startTutorial() {
    // Implement tutorial scene
    alert("Tutorial: Use WASD to move, mouse to look around. Click on characters to talk to them!");
}

// Show settings
function showSettings() {
    // Implement settings
    alert("Settings: Adjust graphics, sound, and controls in the options menu.");
}

// Customize character
function customizeCharacter() {
    // Implement character customization
    alert("Customize your character's appearance and equipment.");
}

// Initialize game
init();
