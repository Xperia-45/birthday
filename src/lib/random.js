export const rand = (min, max) => min + Math.random() * (max - min);

export const randInt = (min, max) => Math.floor(rand(min, max + 1));

export const pick = (list) => list[Math.floor(Math.random() * list.length)];

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/** Stable-ish id generator for particle lists (kept local to the client). */
let counter = 0;
export const nextId = (prefix = 'id') => {
  counter += 1;
  return `${prefix}-${counter}`;
};
