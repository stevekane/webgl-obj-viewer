precision highp float;

uniform sampler2D uTexture;

varying vec3 vNormal;
varying vec2 vUV;
varying mat4 vRot;

void main () {
  vec3 faceDir    = (vRot * vec4(vNormal, 1.0)).xyz;
  float intensity = dot(vec3(-1.0, 1.0, -1.0), faceDir); 
  vec3 texColor   = texture2D(uTexture, vUV).xyz;
  //vec4 color      = vec4(intensity * texColor, 1.0);
  vec4 color      = vec4(intensity * vec3(1.0, 0.7, 0.5), 1.0);
  gl_FragColor    = color;
} 
