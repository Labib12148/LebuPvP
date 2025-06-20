import RAPIER from '@dimforge/rapier3d-compat';

export let world;

export const initPhysics = async () => {
  await RAPIER.init();
  const gravity = new RAPIER.Vector3(0.0, -9.81, 0.0);
  world = new RAPIER.World(gravity);
};

export const stepPhysics = () => {
  if (world) {
    world.step();
  }
};