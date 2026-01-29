#!/bin/bash

# Create directories
mkdir -p assets/models/buildings
mkdir -p assets/models/environment
mkdir -p assets/models/characters
mkdir -p assets/textures/environment
mkdir -p assets/textures/characters
mkdir -p assets/textures/effects
mkdir -p assets/sounds/ambient
mkdir -p assets/sounds/character
mkdir -p assets/sounds/combat
mkdir -p assets/music/medieval
mkdir -p assets/music/ambient
mkdir -p assets/ui/icons
mkdir -p assets/ui/status

# Download models
echo "Downloading 3D models..."
wget -O assets/models/buildings/kingdom-gate.glb https://sketchfab.com/models/abc123def456/download
wget -O assets/models/buildings/medieval-house.glb https://sketchfab.com/models/ghi789jkl012/download
wget -O assets/models/environment/medieval-tree.glb https://sketchfab.com/models/mno345pqr678/download
wget -O assets/models/characters/villager.glb https://sketchfab.com/models/def456ghi789/download
wget -O assets/models/characters/merchant.glb https://sketchfab.com/models/jkl012mno345/download
wget -O assets/models/characters/guard.glb https://sketchfab.com/models/pqr678stu901/download

# Download textures
echo "Downloading textures..."
wget -O assets/textures/environment/grass.jpg https://cc0textures.com/get?file=Grass001_1K.jpg
wget -O assets/textures/environment/dirt-path.jpg https://cc0textures.com/get?file=Dirt005_1K.jpg
wget -O assets/textures/environment/stone-wall.jpg https://cc0textures.com/get?file=StoneWall009_1K.jpg
wget -O assets/textures/environment/roof-tiles.jpg https://cc0textures.com/get?file=RoofTiles003_1K.jpg
wget -O assets/textures/environment/wood-planks.jpg https://cc0textures.com/get?file=WoodPlanks008_1K.jpg
wget -O assets/textures/characters/villager-clothes.jpg https://cc0textures.com/get?file=Cloth008_1K.jpg
wget -O assets/textures/characters/merchant-outfit.jpg https://cc0textures.com/get?file=Cloth012_1K.jpg
wget -O assets/textures/characters/guard-armor.jpg https://cc0textures.com/get?file=MetalArmor005_1K.jpg

# Download special effects
echo "Downloading special effects..."
wget -O assets/textures/effects/fire-particle.png https://opengameart.org/sites/default/files/fire_particle.png
wget -O assets/textures/effects/smoke.png https://opengameart.org/sites/default/files/smoke_texture.png
wget -O assets/textures/effects/magic-glow.png https://opengameart.org/sites/default/files/magic_glow.png

# Download sounds
echo "Downloading sounds..."
wget -O assets/sounds/ambient/wind-trees.ogg https://freesound.org/data/previews/321/321522_1234567-lq.ogg
wget -O assets/sounds/ambient/bird-song.ogg https://freesound.org/data/previews/321/321520_1234567-lq.ogg
wget -O assets/sounds/ambient/owl-hoot.ogg https://freesound.org/data/previews/321/321519_1234567-lq.ogg
wget -O assets/sounds/ambient/horse-gallop.ogg https://freesound.org/data/previews/421/421426_1234567-lq.ogg
wget -O assets/sounds/ambient/blacksmith.ogg https://freesound.org/data/previews/478/478402_1234567-lq.ogg
wget -O assets/sounds/character/footsteps-grass.ogg https://freesound.org/data/previews/421/421424_1234567-lq.ogg
wget -O assets/sounds/character/footsteps-stone.ogg https://freesound.org/data/previews/421/421425_1234567-lq.ogg
wget -O assets/sounds/character/door-open-close.ogg https://freesound.org/data/previews/421/421423_1234567-lq.ogg
wget -O assets/sounds/character/coin.ogg https://freesound.org/data/previews/341/341695_1234567-lq.ogg
wget -O assets/sounds/character/villager-voice.ogg https://freesound.org/data/previews/321/321518_1234567-lq.ogg
wget -O assets/sounds/combat/sword-swing.ogg https://freesound.org/data/previews/415/415742_1234567-lq.ogg
wget -O assets/sounds/combat/shield-block.ogg https://freesound.org/data/previews/321/321517_1234567-lq.ogg
wget -O assets/sounds/combat/magic-spell.ogg https://freesound.org/data/previews/321/321516_1234567-lq.ogg
wget -O assets/sounds/combat/explosion.ogg https://freesound.org/data/previews/321/321515_1234567-lq.ogg

# Download music
echo "Downloading music..."
wget -O assets/music/medieval/village-theme.mp3 https://freemusicarchive.org/file/music/download/Medieval_Village.mp3
wget -O assets/music/medieval/castle-theme.mp3 https://freemusicarchive.org/file/music/download/Medieval_Castle.mp3
wget -O assets/music/medieval/battle-theme.mp3 https://freemusicarchive.org/file/music/download/Medieval_Battle.mp3
wget -O assets/music/medieval/mystical-theme.mp3 https://freemusicarchive.org/file/music/download/Medieval_Mystical.mp3
wget -O assets/music/ambient/forest-ambiance.mp3 https://freemusicarchive.org/file/music/download/ambient_forest.mp3
wget -O assets/music/ambient/cave-ambiance.mp3 https://freemusicarchive.org/file/music/download/ambient_cave.mp3
wget -O assets/music/ambient/night-ambiance.mp3 https://freemusicarchive.org/file/music/download/ambient_night.mp3

# Download UI icons
echo "Downloading UI icons..."
wget -O assets/ui/icons/sword.png https://game-icons.net/png/1x1/delapouite/sword.png
wget -O assets/ui/icons/shield.png https://game-icons.net/png/1x1/delapouite/shield.png
wget -O assets/ui/icons/potion.png https://game-icons.net/png/1x1/delapouite/potion.png
wget -O assets/ui/icons/coin.png https://game-icons.net/png/1x1/delapouite/coin.png
wget -O assets/ui/icons/scroll.png https://game-icons.net/png/1x1/delapouite/scroll.png
wget -O assets/ui/status/heart.png https://game-icons.net/png/1x1/delapouite/heart.png
wget -O assets/ui/status/lightning.png https://game-icons.net/png/1x1/delapouite/lightning-bolt.png
wget -O assets/ui/status/defense.png https://game-icons.net/png/1x1/delapouite/defense.png
wget -O assets/ui/status/speed.png https://game-icons.net/png/1x1/delapouite/speed.png

echo "All assets downloaded successfully!"
