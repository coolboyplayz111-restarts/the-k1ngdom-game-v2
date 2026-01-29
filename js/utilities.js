// Enhanced utility functions for better game quality

class GameUtils {
    static loadModelWithProgress(url, onLoad, onProgress = null) {
        const loader = new THREE.GLTFLoader();
        const manager = new THREE.LoadingManager();
        
        manager.onProgress = (url, itemsLoaded, itemsTotal) => {
            if (onProgress) {
                const progress = Math.round((itemsLoaded / itemsTotal) * 100);
                onProgress(progress);
            }
        };
        
        manager.onLoad = () => {
            console.log('All assets loaded');
        };
        
        loader.setLoadingManager(manager);
        loader.load(url, onLoad);
    }

    static createParticleSystem(textureUrl, count = 100) {
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load(textureUrl);
        
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = count;
        
        const posArray = new Float32Array(particlesCount * 3);
        const scaleArray = new Float32Array(particlesCount);
        
        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 50;
        }
        
        for (let i = 0; i < particlesCount; i++) {
            scaleArray[i] = Math.random();
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        particlesGeometry.setAttribute('scale', new THREE.BufferAttribute(scaleArray, 1));
        
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.5,
            map: texture,
            transparent: true,
            alphaTest: 0.001,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        particles.position.y = 5;
        
        return particles;
    }

    static createWaterSurface(width = 50, height = 50) {
        const waterGeometry = new THREE.PlaneGeometry(width, height, 50, 50);
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
        
        // Add wave animation
        water.tick = (delta) => {
            water.vertices.forEach((vertex, index) => {
                vertex.z = Math.sin(vertex.x * 0.1 + Date.now() * 0.001) * 0.2;
            });
            water.geometry.verticesNeedUpdate = true;
        };
        
        return water;
    }

    static createAmbientSoundtrack() {
        const listener = new THREE.AudioListener();
        const sound = new THREE.Audio(listener);
        const audioLoader = new THREE.AudioLoader();
        
        audioLoader.load('assets/sounds/ambient-meadow.mp3', function(buffer) {
            sound.setBuffer(buffer);
            sound.setLoop(true);
            sound.setVolume(0.5);
            sound.play();
        });
        
        return sound;
    }

    static createQuestSystem() {
        const quests = [];
        let currentQuestIndex = 0;
        
        return {
            addQuest: (quest) => quests.push(quest),
            getCurrentQuest: () => quests[currentQuestIndex],
            completeQuest: () => {
                currentQuestIndex++;
                if (currentQuestIndex >= quests.length) {
                    currentQuestIndex = quests.length - 1;
                }
            },
            getProgress: () => ({
                current: currentQuestIndex + 1,
                total: quests.length
            })
        };
    }
}

// Add to global scope for easy access
window.GameUtils = GameUtils;
