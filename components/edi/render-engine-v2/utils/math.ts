export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
export const pulse = (time: number, speed = 1) => (Math.sin(time * speed) + 1) * .5;
