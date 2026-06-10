export const EDI_GLSL_FBM = `
float ediFbm(vec2 p){
  float value=0.;
  float amplitude=.5;
  for(int octave=0;octave<4;octave++){
    value+=amplitude*ediNoise(p);
    p=p*2.03+vec2(13.1,7.7);
    amplitude*=.5;
  }
  return value;
}
`;
