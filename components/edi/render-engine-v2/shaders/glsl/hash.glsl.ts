export const EDI_GLSL_HASH = `
float ediHash(vec2 p){
  return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);
}
`;
