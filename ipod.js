// iPod Class
// Creates a low-poly 3D iPod in the game that triggers the next song when touched

class Ipod {
    constructor(scene, player, getTerrainHeight) {
        this.scene = scene;
        this.player = player;
        this.getTerrainHeight = getTerrainHeight;
        this.object = null;
        this.cooldown = false;
        this.cooldownTime = 2000; // 2 seconds cooldown between interactions
        this.detectionRadius = 6; // How close player needs to be to interact
        this.floatHeight = 6;
        // Colors
        this.ipodColor = 0xf4f4f4; // Silver/white
        this.displayColor = 0x666666; // Dark display
        this.buttonColor = 0xFFFFFF; // White wheel
        this.emojis = ['🔊', '🎸', '🎵', '🥁', '🎶', '🎧', '🎹', '💿'];
        this.emojiTextures = []; // Store loaded textures
        this.particleSystem = null;
        this.particleTimeout = null;
    }

    async createIpodModel() {
        // Create a group for the whole iPod
        const ipodGroup = new THREE.Group();
        
        // Scale factor to easily adjust the overall size
        const scaleFactor = 1.8;

        // Main body of the iPod - rounded rectangle with beveled edges
        const bodyGeometry = new THREE.BoxGeometry(3 * scaleFactor, 5 * scaleFactor, 0.6 * scaleFactor, 1, 1, 1);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: this.ipodColor,
            roughness: 0.4,
            metalness: 0.9,
        });
        
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        ipodGroup.add(body);
        
        // Screen/display
        const displayGeometry = new THREE.BoxGeometry(2.4 * scaleFactor, 2 * scaleFactor, 0.1 * scaleFactor);
        const displayMaterial = new THREE.MeshStandardMaterial({
            color: this.displayColor,
            roughness: 0.5,
            metalness: 0.2,
            emissive: 0x333333,
            emissiveIntensity: 0.2
        });
        const display = new THREE.Mesh(displayGeometry, displayMaterial);
        display.position.set(0, 0.8 * scaleFactor, 0.35 * scaleFactor);
        ipodGroup.add(display);

        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 512;
        labelCanvas.height = 192;
        const labelContext = labelCanvas.getContext('2d');
        labelContext.clearRect(0, 0, labelCanvas.width, labelCanvas.height);
        labelContext.fillStyle = '#ff69b4';
        labelContext.font = 'bold 72px sans-serif';
        labelContext.textAlign = 'center';
        labelContext.textBaseline = 'middle';
        labelContext.fillText('DJ PANDA', 256, 96);
        const labelTexture = new THREE.CanvasTexture(labelCanvas);
        labelTexture.needsUpdate = true;
        const labelMaterial = new THREE.MeshBasicMaterial({
            map: labelTexture,
            transparent: true
        });
        const label = new THREE.Mesh(
            new THREE.PlaneGeometry(2.2 * scaleFactor, 0.72 * scaleFactor),
            labelMaterial
        );
        label.position.set(0, 0.8 * scaleFactor, 0.42 * scaleFactor);
        ipodGroup.add(label);

        // Create the click wheel
        const wheelGeometry = new THREE.CylinderGeometry(1 * scaleFactor, 1 * scaleFactor, 0.1 * scaleFactor, 16);
        const wheelMaterial = new THREE.MeshStandardMaterial({
            color: this.buttonColor,
            roughness: 0.3,
            metalness: 0.5
        });
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(0, -1.4 * scaleFactor, 0.35 * scaleFactor);
        ipodGroup.add(wheel);
        
        // Center button on the wheel
        const centerButtonGeometry = new THREE.CylinderGeometry(0.3 * scaleFactor, 0.3 * scaleFactor, 0.12 * scaleFactor, 16);
        const centerButton = new THREE.Mesh(centerButtonGeometry, wheelMaterial);
        centerButton.rotation.x = Math.PI / 2;
        centerButton.position.set(0, -1.4 * scaleFactor, 0.4 * scaleFactor);
        ipodGroup.add(centerButton);
        
        // Add glow effect to make the iPod more visible
        const glowMaterial = new THREE.MeshStandardMaterial({
            color: 0x88CCFF,
            transparent: true,
            opacity: 0.3,
            emissive: 0x88CCFF,
            emissiveIntensity: 0.5
        });
        
        const glowGeometry = new THREE.BoxGeometry(3.2 * scaleFactor, 5.2 * scaleFactor, 0.7 * scaleFactor);
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(0, 0, -0.1 * scaleFactor);
        ipodGroup.add(glow);
        
        this.glow = glow;
        ipodGroup.rotation.x = -Math.PI / 18;
        this.object = ipodGroup;
        
        this.startFloatingAnimation();
    }

    loadEmojiTextures() {
        this.emojiTextures = this.emojis.map((emoji) => {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.font = '88px sans-serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(emoji, 64, 68);
            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            return { emoji, texture };
        });
        return Promise.resolve();
    }

    // Modify initialize to load textures (font loading removed)
    async initialize() {
        console.log("Initializing iPod...");
        await this.loadEmojiTextures(); // Load 2D emoji textures
        await this.createIpodModel();   // No font dependency anymore
        this.placeRandomly();
    }
    
    placeRandomly() {
        if (!this.object) return;
        
        // Remove from scene if already added
        if (this.object.parent) {
            this.scene.remove(this.object);
        }
        
        // Find a random position on the map, not too close to the origin
        const angle = Math.random() * Math.PI * 2;
        const distance = 25 + Math.random() * 50; // Between 15 and 55 units from center
        
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        const y = this.getTerrainHeight(x, z);
        
        this.object.position.set(x, y + this.floatHeight, z); // Position slightly above terrain
        this.scene.add(this.object);
        
        console.log(`iPod placed at position: ${x}, ${y + this.floatHeight}, ${z}`);
    }
    
    startFloatingAnimation() {
        // Base position
        const baseY = this.object.position.y;
        
        // Add animation properties
        this.animationParams = {
            speed: 0.5 + Math.random() * 0.5,
            amplitude: 0.3,
            rotationSpeed: 0.3,
            time: Math.random() * Math.PI * 2 // Random starting phase
        };
    }
    
    update(deltaTime) {
        if (!this.object) return;
        
        // Handle floating animation
        this.animationParams.time += deltaTime * this.animationParams.speed;
        
        // Bob up and down
        const floatOffset = Math.sin(this.animationParams.time) * this.animationParams.amplitude;
        const baseY = this.getTerrainHeight(
            this.object.position.x, 
            this.object.position.z
        ) + this.floatHeight; // Base height above terrain
        
        this.object.position.y = baseY + floatOffset;
        
        // Gentle rotation
        this.object.rotation.y += deltaTime * this.animationParams.rotationSpeed;
        
        // Pulse the glow
        if (this.glow) {
            const pulseScale = 1 + Math.sin(this.animationParams.time * 1.5) * 0.07;
            this.glow.scale.set(pulseScale, pulseScale, pulseScale);
        }
        
        // Check for player collision
        if (!this.cooldown) {
            const dx = this.player.position.x - this.object.position.x;
            const dy = this.player.position.y - this.object.position.y;
            const dz = this.player.position.z - this.object.position.z;
            
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            if (distance < this.detectionRadius) {
                this.triggerNextTrack();
                this.startCooldown();
            }
        }
    }
    
    createEmojiFireworks() {
        if (this.emojiTextures.length === 0) {
            console.warn("Emoji textures not loaded yet, cannot create fireworks");
            return;
        }

        const particleGroup = new THREE.Group();
        const particleCount = 25;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const { texture } = this.emojiTextures[Math.floor(Math.random() * this.emojiTextures.length)];
            const material = new THREE.SpriteMaterial({
                map: texture,
                color: new THREE.Color(1, 1, 1), // white
                transparent: true
            });

            const particle = new THREE.Sprite(material);
            particle.scale.set(0.8, 0.8, 0.8); // Adjust size as needed
            particle.position.set(
                this.object.position.x,
                this.object.position.y,
                this.object.position.z
            );

            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 7,
                Math.random() * 7 + 2,
                (Math.random() - 0.5) * 7,
            );

            particleGroup.add(particle);
            particles.push(particle);
        }

        this.scene.add(particleGroup);
        this.particleSystem = { group: particleGroup, particles };

        this.particleTimeout = setTimeout(() => {
            this.removeEmojiFireworks();
        }, 4000);

        this.animateEmojiFireworks(particles);
    }

    animateEmojiFireworks(particles) {
        const startTime = Date.now();
        const duration = 4000;
    
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;
    
            if (progress < 1) {
                particles.forEach(particle => {
                    particle.position.add(particle.velocity.clone().multiplyScalar(0.016));
                    particle.velocity.y -= 0.1; // Gravity
                    // particle.material.opacity = 1 - progress;
                    particle.material.rotation += 0.05; // Rotate the sprite's texture
                });
                requestAnimationFrame(animate);
            }
        };
    
        requestAnimationFrame(animate);
    }

    removeEmojiFireworks() {
        if (this.particleSystem) {
            this.scene.remove(this.particleSystem.group);
            this.particleSystem = null;
        }
        if (this.particleTimeout) {
            clearTimeout(this.particleTimeout);
            this.particleTimeout = null;
        }
    }

    triggerNextTrack() {
        console.log("iPod touched, playing next track");
        this.createEmojiFireworks();
    
        if (window.soundSystem && window.soundSystem.initialized) {
            // Only play next track if sound is not muted
            if (!window.soundSystem.muted) {
                window.soundSystem.playNextTrack();
            } else {
                console.log("Sound is muted, skipping to next track without playing");
                // Still advance the track index without playing it
                window.soundSystem.currentTrackIndex = 
                    (window.soundSystem.currentTrackIndex + 1) % window.soundSystem.musicTracks.length;
                console.log(`Advanced to track ${window.soundSystem.currentTrackIndex + 1} (muted)`);
            }
        } else {
            console.warn("Sound system not initialized yet");
        }
    }
    
    startCooldown() {
        this.cooldown = true;
        
        setTimeout(() => {
            this.cooldown = false;
        }, this.cooldownTime);
    }

    destroy() {
        this.removeEmojiFireworks();
        if (this.object && this.object.parent) {
            this.scene.remove(this.object);
        }
    }
}

// Export for use in game.js
window.Ipod = Ipod;
