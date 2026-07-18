import * as THREE from 'three';

// Dev-only terrain-following measurement circle. Keeping the vertices in world
// space lets every point sample the real ground instead of cutting through
// hills like a flat RingGeometry would.
export class DevDistanceRadius {
  constructor(scene, segments = 160) {
    this.radius = 25;
    this.enabled = false;
    this.segments = segments;
    this.lastX = Infinity;
    this.lastZ = Infinity;
    this.lastRadius = 0;
    this.lastWorld = null;

    this.positions = new Float32Array(segments * 3);
    this.geometry = new THREE.BufferGeometry();
    const position = new THREE.BufferAttribute(this.positions, 3);
    position.setUsage(THREE.DynamicDrawUsage);
    this.geometry.setAttribute('position', position);

    this.material = new THREE.LineBasicMaterial({
      color: 0x58e8ff,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
      depthWrite: false,
      fog: false,
      toneMapped: false,
    });
    this.line = new THREE.LineLoop(this.geometry, this.material);
    this.line.visible = false;
    this.line.frustumCulled = false;
    this.line.renderOrder = 1000;
    scene.add(this.line);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) this.line.visible = false;
  }

  setRadius(radius) {
    this.radius = Math.max(1, radius);
  }

  update(player, world, inGameplay) {
    const visible = this.enabled && inGameplay;
    this.line.visible = visible;
    if (!visible || !player || !world?.heightAt) return;

    const x = player.pos.x;
    const z = player.pos.z;
    const unchanged = world === this.lastWorld
      && Math.abs(x - this.lastX) < 0.05
      && Math.abs(z - this.lastZ) < 0.05
      && this.radius === this.lastRadius;
    if (unchanged) return;

    for (let i = 0; i < this.segments; i++) {
      const angle = (i / this.segments) * Math.PI * 2;
      const px = x + Math.cos(angle) * this.radius;
      const pz = z + Math.sin(angle) * this.radius;
      const offset = i * 3;
      this.positions[offset] = px;
      this.positions[offset + 1] = world.heightAt(px, pz) + 0.22;
      this.positions[offset + 2] = pz;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.lastX = x;
    this.lastZ = z;
    this.lastRadius = this.radius;
    this.lastWorld = world;
  }
}
