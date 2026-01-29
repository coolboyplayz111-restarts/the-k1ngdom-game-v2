// Kingdom Furi RPG - Render Optimized Version
class KingdomFuriGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.npcs = [];
        this.enemies = [];
        this.items = [];
        this.weatherSystem = null;
        this.dayNightCycle = null;
        this.combatSystem = null;
        this.craftingSystem = null;
        this.dialogueSystem = null;
        this.inventorySystem = null;
        this.questSystem = null;
        
        this.isLoaded = false;
        this.isLoading = false;
        this.currentlyInteracting = null;
        this.loadingProgress = 0;
        
        this.keys = {};
        this.mouse = { x: 0, y: 0 };
        this.assetsBaseUrl = '/assets/';
    }

    async initialize() {
        this.showLoadingScreen();
        this.setupScene();
        this.setupLighting();
        this.setupCamera();
        this.setupRenderer();
        this.setupInput();
        this.setupAudio();
        
        await this.loadAssets();
        this.createWorld();
        this.createUI();
        
        this.isLoaded = true;
        this.hideLoadingScreen();
        this.startGameLoop();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 100);
        
        // Post-processing effects
        this.composer = new THREE.EffectComposer(this.renderer);
        this.renderPass = new THREE.RenderPass(this.scene, this.camera);
        this.composer.addPass(this.renderPass);
        
        const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = 0.12;
        bloomPass.strength = 0.8;
        bloomPass.radius = 0.8;
        this.composer.addPass(bloomPass);
    }

    setupLighting() {
        // Sun light with shadows
        this.sunLight = new THREE.DirectionalLight(0xFFE4B5, 1.5);
        this.sunLight.position.set(50, 100, 50);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 4096;
        this.sunLight.shadow.mapSize.height = 4096;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        this.scene.add(this.sunLight);
        
        // Ambient light
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(this.ambientLight);
        
        // Point lights for buildings
        this.createBuildingLights();
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 5, 15);
        
        // Smooth camera follow
        this.cameraTarget = new THREE.Vector3();
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('gameCanvas'), 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        this.renderer.setClearColor(0x87CEEB);
    }

    setupInput() {
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        });
        window.addEventListener('click', (e) => this.handleClick(e));
        window.addEventListener('resize', (e) => this.handleResize(e));
    }

    setupAudio() {
        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);
        
        this.soundEffects = {
            footsteps: new THREE.Audio(this.listener),
            combat: new THREE.Audio(this.listener),
            ambient: new THREE.Audio(this.listener)
        };
        
        this.loadAudio();
    }

    async loadAssets() {
        this.isLoading = true;
        this.updateLoadingProgress(0);
        
        // Load models
        this.models = await this.loadModels();
        this.updateLoadingProgress(20);
        
        // Load textures
        this.textures = await this.loadTextures();
        this.updateLoadingProgress(40);
        
        // Load sounds
        await this.loadSounds();
        this.updateLoadingProgress(60);
        
        // Load music
        await this.loadMusic();
        this.updateLoadingProgress(80);
        
        // Initialize systems
        this.initializeSystems();
        this.updateLoadingProgress(100);
        
        this.isLoading = false;
    }

    loadModels() {
        const loader = new THREE.GLTFLoader();
        const models = {};
        
        const loadModel = (url, name) => {
            return loader.loadAsync(url).then(gltf => {
                models[name] = gltf.scene;
                this.updateLoadingProgress(this.loadingProgress + 1);
            });
        };
        
        const promises = [
            loadModel(`${this.assetsBaseUrl}models/buildings/kingdom-gate.glb`, 'kingdomGate'),
            loadModel(`${this.assetsBaseUrl}models/buildings/medieval-house.glb`, 'medievalHouse'),
            loadModel(`${this.assetsBaseUrl}models/environment/medieval-tree.glb`, 'medievalTree'),
            loadModel(`${this.assetsBaseUrl}models/characters/villager.glb`, 'villager'),
            loadModel(`${this.assetsBaseUrl}models/characters/merchant.glb`, 'merchant'),
            loadModel(`${this.assetsBaseUrl}models/characters/guard.glb`, 'guard')
        ];
        
        return Promise.all(promises).then(() => models);
    }

    loadTextures() {
        const textureLoader = new THREE.TextureLoader();
        const textures = {};
        
        const loadTexture = (url, name) => {
            return new Promise(resolve => {
                textures[name] = textureLoader.load(url, resolve);
            });
        };
        
        const promises = [
            loadTexture(`${this.assetsBaseUrl}textures/environment/grass.jpg`, 'grass'),
            loadTexture(`${this.assetsBaseUrl}textures/environment/dirt-path.jpg`, 'dirtPath'),
            loadTexture(`${this.assetsBaseUrl}textures/environment/stone-wall.jpg`, 'stoneWall'),
            loadTexture(`${this.assetsBaseUrl}textures/environment/roof-tiles.jpg`, 'roofTiles'),
            loadTexture(`${this.assetsBaseUrl}textures/environment/wood-planks.jpg`, 'woodPlanks'),
            loadTexture(`${this.assetsBaseUrl}textures/characters/villager-clothes.jpg`, 'villagerClothes'),
            loadTexture(`${this.assetsBaseUrl}textures/characters/merchant-outfit.jpg`, 'merchantOutfit'),
            loadTexture(`${this.assetsBaseUrl}textures/characters/guard-armor.jpg`, 'guardArmor')
        ];
        
        return Promise.all(promises).then(() => textures);
    }

    loadSounds() {
        const audioLoader = new THREE.AudioLoader();
        
        const loadSound = (url, name) => {
            return new Promise(resolve => {
                audioLoader.load(url, buffer => {
                    this.soundEffects[name].setBuffer(buffer);
                    this.soundEffects[name].setLoop(name === 'ambient');
                    this.soundEffects[name].setVolume(name === 'ambient' ? 0.5 : 1);
                    if (name === 'ambient') this.soundEffects[name].play();
                    resolve();
                });
            });
        };
        
        const promises = [
            loadSound(`${this.assetsBaseUrl}sounds/ambient/wind-trees.ogg`, 'ambient'),
            loadSound(`${this.assetsBaseUrl}sounds/character/footsteps-grass.ogg`, 'footsteps'),
            loadSound(`${this.assetsBaseUrl}sounds/combat/sword-swing.ogg`, 'combat')
        ];
        
        return Promise.all(promises);
    }

    loadMusic() {
        // Load music tracks
        return new Promise(resolve => {
            // Music loading would go here
            resolve();
        });
    }

    initializeSystems() {
        this.animationController = new AnimationController();
        this.dialogueSystem = new DialogueSystem();
        this.inventorySystem = new InventorySystem();
        this.questSystem = new QuestSystem();
        this.combatSystem = new CombatSystem();
        this.craftingSystem = new CraftingSystem();
    }

    createWorld() {
        this.createTerrain();
        this.createBuildings();
        this.createEnvironment();
        this.createNPCs();
        this.createPlayer();
        this.setupWeatherSystem();
        this.setupDayNightCycle();
    }

    createTerrain() {
        const terrainGeometry = new THREE.PlaneGeometry(200, 200, 128, 128);
        const simplex = new SimplexNoise(Math.random());
        
        terrainGeometry.vertices.forEach((vertex, index) => {
            const x = (index % 129) / 10;
            const y = Math.floor(index / 129) / 10;
            vertex.z = simplex.noise2D(x / 5, y / 5) * 10;
        });
        
        terrainGeometry.computeVertexNormals();
        
        const materials = [
            new THREE.MeshLambertMaterial({ map: this.textures.grass }),
            new THREE.MeshLambertMaterial({ map: this.textures.dirtPath }),
            new THREE.MeshLambertMaterial({ map: this.textures.stoneWall })
        ];
        
        const terrain = new THREE.SceneUtils.createMultiMaterialObject(terrainGeometry, materials);
        terrain.rotation.x = -Math.PI / 2;
        terrain.receiveShadow = true;
        this.scene.add(terrain);
        
        this.createWaterBodies();
    }

    createBuildings() {
        // Kingdom gate
        const kingdomGate = this.models.kingdomGate.clone();
        kingdomGate.position.set(0, 0, -50);
        kingdomGate.scale.set(2, 2, 2);
        kingdomGate.castShadow = true;
        kingdomGate.traverse(child => {
            if (child.isMesh) child.receiveShadow = true;
        });
        this.scene.add(kingdomGate);
        
        // Player house
        const playerHouse = this.models.medievalHouse.clone();
        playerHouse.position.set(-30, 0, 20);
        playerHouse.scale.set(1.5, 1.5, 1.5);
        playerHouse.castShadow = true;
        playerHouse.traverse(child => {
            if (child.isMesh) child.receiveShadow = true;
        });
        this.scene.add(playerHouse);
        
        this.createVillageBuildings();
    }

    createEnvironment() {
        this.createForest();
        this.createRocks();
        this.createPaths();
    }

    createNPCs() {
        this.createVillagers();
        this.createMerchants();
        this.createGuards();
        this.createQuestNPCs();
    }

    createPlayer() {
        const playerGeometry = new THREE.CapsuleGeometry(0.5, 2, 4, 8);
        const playerMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        this.player = new THREE.Mesh(playerGeometry, playerMaterial);
        this.player.position.set(0, 1, 10);
        this.player.castShadow = true;
        this.scene.add(this.player);
        
        this.playerAnimations = {
            idle: this.createIdleAnimation(),
            walk: this.createWalkAnimation(),
            run: this.createRunAnimation()
        };
    }

    createUI() {
        this.createHealthBar();
        this.createGoldCounter();
        this.createQuestLog();
        this.createDialogueBox();
        this.createMiniMap();
    }

    setupWeatherSystem() {
        this.weatherSystem = {
            currentWeather: 'clear',
            weatherEffects: [],
            update: (delta) => {
                this.weatherSystem.weatherEffects.forEach(effect => effect.update(delta));
            }
        };
        this.createWeatherEffects();
    }

    setupDayNightCycle() {
        this.dayNightCycle = {
            currentTime: 0,
            timeSpeed: 0.0001,
            update: (delta) => {
                this.dayNightCycle.currentTime += delta * this.dayNightCycle.timeSpeed;
                
                const time = this.dayNightCycle.currentTime % 1;
                const sunAngle = time * Math.PI * 2;
                this.sunLight.position.x = Math.cos(sunAngle) * 100;
                this.sunLight.position.y = Math.sin(sunAngle) * 50 + 50;
                this.sunLight.position.z = Math.sin(sunAngle) * 100;
                
                const brightness = Math.sin(sunAngle) * 0.5 + 0.5;
                this.ambientLight.intensity = brightness * 0.6;
                
                const fogDensity = brightness * 0.01;
                this.scene.fog.density = fogDensity;
            }
        };
    }

    startGameLoop() {
        const clock = new THREE.Clock();
        
        const gameLoop = () => {
            if (!this.isLoaded) return;
            
            const delta = clock.getDelta();
            
            this.update(delta);
            this.renderer.render(this.scene, this.camera);
            // this.composer.render(delta);
            
            requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
    }

    update(delta) {
        if (this.isLoading) return;
        
        this.updatePlayerMovement(delta);
        this.updateCamera(delta);
        this.updateNPCs(delta);
        this.updateEnemies(delta);
        this.weatherSystem.update(delta);
        this.dayNightCycle.update(delta);
        this.combatSystem.update(delta);
        this.updateAnimations(delta);
    }

    updatePlayerMovement(delta) {
        const moveSpeed = 5;
        const playerMovement = new THREE.Vector3();
        
        if (this.keys['KeyW']) playerMovement.z -= moveSpeed * delta;
        if (this.keys['KeyS']) playerMovement.z += moveSpeed * delta;
        if (this.keys['KeyA']) playerMovement.x -= moveSpeed * delta;
        if (this.keys['KeyD']) playerMovement.x += moveSpeed * delta;
        
        this.player.position.add(playerMovement);
        this.player.position.y = this.getTerrainHeight(this.player.position.x, this.player.position.z) + 1;
        
        if (playerMovement.length() > 0) {
            this.playPlayerAnimation('walk');
        } else {
            this.playPlayerAnimation('idle');
        }
    }

    updateCamera(delta) {
        this.cameraTarget.copy(this.player.position);
        this.cameraTarget.y += 5;
        this.cameraTarget.z += 10;
        
        this.camera.position.lerp(this.cameraTarget, 0.1);
        this.camera.lookAt(this.player.position);
    }

    updateNPCs(delta) {
        this.npcs.forEach(npc => {
            npc.update(delta);
            
            if (npc.distanceToPlayer < 3 && this.keys['KeyE']) {
                this.startInteraction(npc);
            }
        });
    }

    updateEnemies(delta) {
        this.enemies.forEach(enemy => {
            enemy.update(delta);
            
            if (enemy.distanceToPlayer < 10) {
                this.combatSystem.startCombat(enemy);
            }
        });
    }

    updateAnimations(delta) {
        Object.values(this.playerAnimations).forEach(animation => {
            animation.update(delta);
        });
        
        this.npcs.forEach(npc => {
            Object.values(npc.animations).forEach(animation => {
                animation.update(delta);
            });
        });
    }

    handleClick(event) {
        if (this.currentlyInteracting) return;
        
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, this.camera);
        
        const npcIntersects = raycaster.intersectObjects(this.npcs.map(npc => npc.mesh));
        if (npcIntersects.length > 0) {
            const npc = this.npcs.find(npc => npc.mesh === npcIntersects[0].object);
            if (npc) {
                this.startInteraction(npc);
                return;
            }
        }
        
        const itemIntersects = raycaster.intersectObjects(this.items.map(item => item.mesh));
        if (itemIntersects.length > 0) {
            const item = this.items.find(item => item.mesh === itemIntersects[0].object);
            if (item) {
                this.pickupItem(item);
                return;
            }
        }
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    startInteraction(npc) {
        this.currentlyInteracting = npc;
        this.dialogueSystem.startConversation(npc.id);
    }

    pickupItem(item) {
        this.inventorySystem.addItem(item);
        this.scene.remove(item.mesh);
        this.items = this.items.filter(i => i !== item);
        this.showMessage(`Picked up: ${item.name}`);
    }

    createIdleAnimation() {
        return {
            mixer: new THREE.AnimationMixer(this.player),
            action: null,
            update: (delta) => {
                if (this.action) this.action.update(delta);
            }
        };
    }

    createWalkAnimation() {
        return {
            mixer: new THREE.AnimationMixer(this.player),
            action: null,
            update: (delta) => {
                if (this.action) this.action.update(delta);
            }
        };
    }

    playPlayerAnimation(animationName) {
        const animation = this.playerAnimations[animationName];
        if (animation && !animation.action) {
            // Create and play animation
        }
    }

    getTerrainHeight(x, z) {
        return 0;
    }

    createBuildingLights() {
        const buildingLights = [];
        
        for (let i = 0; i < 5; i++) {
            const light = new THREE.PointLight(0xFFD700, 1, 10);
            light.position.set(
                (Math.random() - 0.5) * 50,
                5,
                (Math.random() - 0.5) * 50
            );
            this.scene.add(light);
            buildingLights.push(light);
        }
        
        return buildingLights;
    }

    createWeatherEffects() {
        const rainGeometry = new THREE.BufferGeometry();
        const rainCount = 1000;
        const positions = new Float32Array(rainCount * 3);
        
        for (let i = 0; i < rainCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 100;
        }
        
        rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const rainMaterial = new THREE.PointsMaterial({
            color: 0x9EB3C4,
            size: 0.1,
            transparent: true
        });
        
        const rain = new THREE.Points(rainGeometry, rainMaterial);
        this.weatherSystem.weatherEffects.push({
            mesh: rain,
            update: (delta) => {
                rain.rotation.z += delta * 0.5;
            }
        });
        this.scene.add(rain);
    }

    createWaterBodies() {
        const waterGeometry = new THREE.PlaneGeometry(50, 50);
        const waterMaterial = new THREE.MeshPhongMaterial({
            color: 0x1E90FF,
            transparent: true,
            opacity: 0.7,
            shininess: 100,
            specular: 0x33AAFF
        });
        
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2;
        water.position.y = -0.5;
        this.scene.add(water);
        
        water.tick = (delta) => {
            water.rotation.z += delta * 0.01;
        };
    }

    createForest() {
        const treeLoader = new THREE.GLTFLoader();
        const treePositions = [];
        
        for (let i = 0; i < 100; i++) {
            treePositions.push({
                x: (Math.random() - 0.5) * 80,
                z: (Math.random() - 0.5) * 80,
                scale: 0.5 + Math.random() * 1.5,
                type: Math.random() > 0.5 ? 'oak' : 'pine'
            });
        }
        
        treeLoader.load(`${this.assetsBaseUrl}models/environment/medieval-tree.glb`, (gltf) => {
            const treeModel = gltf.scene.children[0];
            treeModel.castShadow = true;
            
            const matrix = new THREE.Matrix4();
            const instancedMesh = new THREE.InstancedMesh(treeModel.geometry, treeModel.material, 100);
            
            treePositions.forEach((pos, index) => {
                matrix.setPosition(pos.x, 0, pos.z);
                matrix.scale(new THREE.Vector3(pos.scale, pos.scale, pos.scale));
                instancedMesh.setMatrixAt(index, matrix);
            });
            
            this.scene.add(instancedMesh);
        });
    }

    createRocks() {
        const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
        const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        for (let i = 0; i < 20; i++) {
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(
                (Math.random() - 0.5) * 50,
                0,
                (Math.random() - 0.5) * 50
            );
            rock.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            rock.scale.setScalar(0.5 + Math.random() * 2);
            rock.castShadow = true;
            this.scene.add(rock);
        }
    }

    createPaths() {
        const pathGeometry = new THREE.PlaneGeometry(5, 50);
        const pathMaterial = new THREE.MeshLambertMaterial({ map: this.textures.dirtPath });
        
        const path = new THREE.Mesh(pathGeometry, pathMaterial);
        path.position.set(-25, 0.1, 0);
        path.rotation.x = -Math.PI / 2;
        path.receiveShadow = true;
        this.scene.add(path);
    }

    createVillagers() {
        for (let i = 0; i < 10; i++) {
            const villager = {
                id: `villager_${i}`,
                mesh: this.models.villager.clone(),
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * 30,
                    0,
                    (Math.random() - 0.5) * 30
                ),
                animations: {
                    idle: this.createIdleAnimation(),
                    walk: this.createWalkAnimation()
                },
                update: (delta) => {
                    if (Math.random() < 0.01) {
                        // Change direction
                    }
                }
            };
            
            villager.mesh.position.copy(villager.position);
            villager.mesh.scale.set(1, 1, 1);
            villager.mesh.castShadow = true;
            villager.mesh.traverse(child => {
                if (child.isMesh) child.receiveShadow = true;
            });
            
            this.scene.add(villager.mesh);
            this.npcs.push(villager);
        }
    }

    createMerchants() {
        const merchant = {
            id: 'merchant_1',
            mesh: this.models.merchant.clone(),
            position: new THREE.Vector3(20, 0, -10),
            inventory: [
                { name: "Health Potion", price: 10, icon: "assets/ui/icons/potion.png" },
                { name: "Iron Sword", price: 50, icon: "assets/ui/icons/sword.png" }
            ],
            update: (delta) => {
                // Merchant behavior
            }
        };
        
        merchant.mesh.position.copy(merchant.position);
        merchant.mesh.scale.set(1, 1, 1);
        merchant.mesh.castShadow = true;
        merchant.mesh.traverse(child => {
            if (child.isMesh) child.receiveShadow = true;
        });
        
        this.scene.add(merchant.mesh);
        this.npcs.push(merchant);
    }

    createGuards() {
        for (let i = 0; i < 3; i++) {
            const guard = {
                id: `guard_${i}`,
                mesh: this.models.guard.clone(),
                patrolRoute: [
                    new THREE.Vector3(-20, 0, -30),
                    new THREE.Vector3(20, 0, -30),
                    new THREE.Vector3(20, 0, 30),
                    new THREE.Vector3(-20, 0, 30)
                ],
                currentPatrolIndex: 0,
                update: (delta) => {
                    const target = guard.patrolRoute[guard.currentPatrolIndex];
                    const distance = guard.mesh.position.distanceTo(target);
                    
                    if (distance < 1) {
                        guard.currentPatrolIndex = (guard.currentPatrolIndex + 1) % guard.patrolRoute.length;
                    } else {
                        const direction = new THREE.Vector3().subVectors(target, guard.mesh.position).normalize();
                        guard.mesh.position.add(direction.multiplyScalar(1 * delta));
                    }
                }
            };
            
            guard.mesh.position.copy(guard.patrolRoute[0]);
            guard.mesh.scale.set(1, 1, 1);
            guard.mesh.castShadow = true;
            guard.mesh.traverse(child => {
                if (child.isMesh) child.receiveShadow = true;
            });
            
            this.scene.add(guard.mesh);
            this.npcs.push(guard);
        }
    }

    createQuestNPCs() {
        const questNPC = {
            id: 'quest_npc',
            mesh: this.models.villager.clone(),
            position: new THREE.Vector3(10, 0, 5),
            hasQuest: true,
            quest: {
                id: 'find_lost_sheep',
                name: "Find the Lost Sheep",
                description: "The shepherd has lost some sheep. Help find them!",
                objectives: [
                    { type: "collect", target: "sheep", amount: 3 }
                ],
                reward: { gold: 50, experience: 100 }
            },
            update: (delta) => {
                // Quest NPC behavior
            }
        };
        
        questNPC.mesh.position.copy(questNPC.position);
        questNPC.mesh.scale.set(1, 1, 1);
        questNPC.mesh.castShadow = true;
        questNPC.mesh.traverse(child => {
            if (child.isMesh) child.receiveShadow = true;
        });
        
        this.scene.add(questNPC.mesh);
        this.npcs.push(questNPC);
    }

    createHealthBar() {
        const healthBar = document.createElement('div');
        healthBar.className = 'health-bar';
        healthBar.innerHTML = `
            <div class="health-label">Health</div>
            <div id="healthFill" class="health-fill"></div>
        `;
        document.getElementById('ui').appendChild(healthBar);
    }

    createGoldCounter() {
        const goldCounter = document.createElement('div');
        goldCounter.className = 'gold-counter';
        goldCounter.id = 'goldCounter';
        goldCounter.textContent = 'Gold: 0';
        document.getElementById('ui').appendChild(goldCounter);
    }

    createQuestLog() {
        const questLog = document.createElement('div');
        questLog.className = 'quest-log';
        questLog.id = 'questLog';
        questLog.innerHTML = '<h3>Quest Log</h3>';
        document.getElementById('ui').appendChild(questLog);
    }

    createDialogueBox() {
        const dialogueBox = document.createElement('div');
        dialogueBox.className = 'dialogue-box';
        dialogueBox.id = 'dialogueBox';
        document.getElementById('ui').appendChild(dialogueBox);
    }

    createMiniMap() {
        const miniMap = document.createElement('canvas');
        miniMap.className = 'mini-map';
        miniMap.id = 'miniMap';
        miniMap.width = 150;
        miniMap.height = 150;
        document.getElementById('ui').appendChild(miniMap);
        
        const ctx = miniMap.getContext('2d');
        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, 150, 150);
    }

    showLoadingScreen() {
        document.getElementById('loadingScreen').style.display = 'flex';
    }

    hideLoadingScreen() {
        document.getElementById('loadingScreen').style.display = 'none';
    }

    updateLoadingProgress(percent) {
        this.loadingProgress = percent;
        document.getElementById('loadingProgress').textContent = `${percent}%`;
    }

    showMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8); color: white; padding: 20px;
            border-radius: 10px; z-index: 1000; font-size: 18px;
        `;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 3000);
    }

    startGame() {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('healthBar').style.display = 'block';
        document.getElementById('goldCounter').style.display = 'block';
        document.getElementById('questLog').style.display = 'block';
    }

    startTutorial() {
        alert("Tutorial: Use WASD to move, mouse to look around. Click on characters to talk to them!");
    }

    showSettings() {
        alert("Settings: Adjust graphics, sound, and controls in the options menu.");
    }

    customizeCharacter() {
        alert("Customize your character's appearance and equipment.");
    }
}

// Initialize the game
const game = new KingdomFuriGame();
game.initialize();

// Export for global access
window.game = game;
