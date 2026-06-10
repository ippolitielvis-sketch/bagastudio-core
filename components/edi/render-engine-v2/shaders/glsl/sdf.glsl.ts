export const EDI_GLSL_SDF = `
float ediEllipseDistance(vec2 point,vec2 scale){
  return length(point/scale);
}

float ediSoftBody(float distanceToBody,float radius){
  return 1.-smoothstep(radius*.68,radius,distanceToBody);
}
`;
