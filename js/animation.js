// Enhanced animation system

class AnimationController {
    constructor() {
        this.animations = new Map();
        this.mixers = new Map();
    }

    addAnimation(object, clipName, animationClip) {
        if (!this.animations.has(object)) {
            this.animations.set(object, new Map());
        }
        
        this.animations.get(object).set(clipName, animationClip);
    }

    playAnimation(object, clipName, loop = true) {
        const clips = this.animations.get(object);
        if (!clips) return;
        
        const clip = clips.get(clipName);
        if (!clip) return;
        
        const mixer = this.getMixer(object);
        const action = mixer.clipAction(clip);
        
        action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
        action.play();
        
        return action;
    }

    getMixer(object) {
        if (!this.mixers.has(object)) {
            this.mixers.set(object, new THREE.AnimationMixer(object));
        }
        return this.mixers.get(object);
    }

    update(delta) {
        this.mixers.forEach(mixer => mixer.update(delta));
    }

    createCharacterIdleAnimation(character) {
        const idleAnimation = {
            key: 'idle',
            start: () => {
                this.playAnimation(character, 'idle');
            }
        };
        return idleAnimation;
    }

    createCharacterWalkAnimation(character) {
        const walkAnimation = {
            key: 'walk',
            start: () => {
                this.playAnimation(character, 'walk');
            }
        };
        return walkAnimation;
    }
}

// Add to global scope
window.AnimationController = AnimationController;
