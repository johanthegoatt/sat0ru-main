import test from "node:test";
import assert from "node:assert/strict";
import { analyzeHand, detectTechnique } from "../src/vision/gestures.js";

// A hand pose in its own frame (wrist at the origin, fingers along +y), then
// rotated and placed in the camera frame. extended: which of index, middle,
// ring, pinky are straight.
function pose({ extended = [true, true, true, true], thumbOut = true, angle = 0, scale = 0.08, at = { x: 0.5, y: 0.6 } } = {}) {
  const raw = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
  raw[0] = { x: 0, y: 0 };
  const cols = [-0.35, -0.1, 0.12, 0.33];
  [5, 9, 13, 17].forEach((mcp, f) => {
    const x = cols[f];
    raw[mcp] = { x, y: 1 };
    raw[mcp + 1] = { x, y: 1.45 };
    raw[mcp + 2] = extended[f] ? { x, y: 1.75 } : { x, y: 1.25 };
    // Straight fingers fan out a little, the way a real V sign does.
    raw[mcp + 3] = extended[f] ? { x: x * 2, y: 2.0 } : { x: x * 0.9, y: 0.95 };
  });
  raw[1] = { x: -0.4, y: 0.25 };
  raw[2] = { x: -0.7, y: 0.45 };
  raw[3] = thumbOut ? { x: -0.95, y: 0.65 } : { x: -0.45, y: 0.7 };
  raw[4] = thumbOut ? { x: -1.2, y: 0.85 } : { x: -0.25, y: 0.85 };
  const c = Math.cos(angle), s = Math.sin(angle);
  return raw.map((p) => ({
    x: at.x + (p.x * c - p.y * s) * scale,
    y: at.y - (p.x * s + p.y * c) * scale,
    z: 0
  }));
}

test("an open palm reads as open upright and tilted sideways", () => {
  for (const angle of [0, 0.6, Math.PI / 2, -Math.PI / 2]) {
    assert.equal(analyzeHand(pose({ angle })).isOpenPalm, true, `angle ${angle}`);
  }
});

test("a pointing finger reads as a point when the hand is sideways", () => {
  const h = analyzeHand(pose({ extended: [true, false, false, false], thumbOut: false, angle: Math.PI / 2 }));
  assert.equal(h.isPoint, true);
  assert.equal(detectTechnique([h]), "red");
});

test("peace and rock signs survive a tilt", () => {
  const peace = analyzeHand(pose({ extended: [true, true, false, false], thumbOut: false, angle: 0.8 }));
  assert.equal(peace.isPeace, true);
  const rock = analyzeHand(pose({ extended: [true, false, false, true], thumbOut: false, angle: -0.8 }));
  assert.equal(rock.isRock, true);
});

test("curled fingers are not counted as up at any angle", () => {
  for (const angle of [0, 1.2, 3]) {
    const h = analyzeHand(pose({ extended: [false, false, false, false], thumbOut: false, angle }));
    assert.equal(h.isOpenPalm, false);
    assert.equal(h.isPoint, false);
  }
});
