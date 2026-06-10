export const EDI_GLSL_COLOR = `
vec3 ediEnergyColor(float energy){
  vec3 deepBlue=vec3(.025,.16,.46);
  vec3 warmGold=vec3(1.,.62,.18);
  return mix(deepBlue,warmGold,clamp(energy,0.,1.));
}
`;
