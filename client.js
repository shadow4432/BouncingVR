import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { VRButton } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/VRButton.js';

const socket = io();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

// Lighting
const light = new THREE.HemisphereLight(0xffffff, 0x444444);
scene.add(light);

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({ color: 0x202020 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Ball
const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.1, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xff4444 })
);
ball.position.set(0, 0.2, 0);
scene.add(ball);
let ballVelocity = new THREE.Vector3(0.02, 0, 0.01);

// Controllers
const controller1 = renderer.xr.getController(0);
const controller2 = renderer.xr.getController(1);
scene.add(controller1, controller2);

// Paddle visual
const paddleGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.05);
const paddleMaterial = new THREE.MeshStandardMaterial({ color: 0x44ff44 });
const paddle1 = new THREE.Mesh(paddleGeometry, paddleMaterial);
const paddle2 = new THREE.Mesh(paddleGeometry, paddleMaterial);
controller1.add(paddle1);
controller2.add(paddle2);

// Players map
const players = {};

// Networking
socket.on('player-move', ({ id, position }) => {
  if (!players[id]) {
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x9999ff })
    );
    scene.add(sphere);
    players[id] = sphere;
  }
  players[id].position.set(position.x, position.y, position.z);
});

socket.on('player-disconnected', ({ id }) => {
  if (players[id]) {
    scene.remove(players[id]);
    delete players[id];
  }
});

// Collision detection
function checkCollision(paddle) {
  const dist = ball.position.distanceTo(paddle.getWorldPosition(new THREE.Vector3()));
  return dist < 0.3;
}

// Animate loop
renderer.setAnimationLoop(() => {
  // Move the ball
  ball.position.add(ballVelocity);

  // Bounce off walls
  if (Math.abs(ball.position.x) > 5) ballVelocity.x *= -1;
  if (Math.abs(ball.position.z) > 5) ballVelocity.z *= -1;

  // Bounce off paddles
  if (checkCollision(paddle1) || checkCollision(paddle2)) {
    ballVelocity.x *= -1.2;
    ballVelocity.z *= 1.1;
  }

  // Send player position
  const pos = camera.getWorldPosition(new THREE.Vector3());
  socket.emit('player-move', { position: pos });

  renderer.render(scene, camera);
});
