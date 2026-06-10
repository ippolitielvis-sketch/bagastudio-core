export const EDI_GLSL_PULSE = `
float ediOrganicPulse(float time){
  return .5+.5*sin(time+sin(time*.37)*.65);
}
`;
