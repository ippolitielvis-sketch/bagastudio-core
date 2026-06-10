export const EDI_GLSL_NOISE = `
float ediNoise(vec2 p){
  vec2 i=floor(p);
  vec2 f=fract(p);
  f=f*f*(3.-2.*f);
  return mix(mix(ediHash(i),ediHash(i+vec2(1.,0.)),f.x),mix(ediHash(i+vec2(0.,1.)),ediHash(i+vec2(1.,1.)),f.x),f.y);
}
`;
