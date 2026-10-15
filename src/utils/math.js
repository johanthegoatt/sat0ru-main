export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function normalizedDistance(landmarks, aIdx, bIdx, scale) {
  return distance(landmarks[aIdx], landmarks[bIdx]) / Math.max(scale, 0.0001);
}

// A finger is straight when its tip is clearly further from the wrist than
// its middle joint. The old "tip above joint on screen" check only worked
// for an upright hand: tilt it sideways or point it at the camera's edge and
// a straight finger read as curled. `margin` is in the same units as the
// landmarks (callers pass a fraction of palm length).
export function isFingerUp(landmarks, tip, pip, margin = 0) {
  const wrist = landmarks[0];
  return distance(landmarks[tip], wrist) > distance(landmarks[pip], wrist) + margin;
}