precision highp float;

uniform sampler2D uDiffuse;
uniform sampler2D uAmbient;
uniform sampler2D uSpecularity;
uniform sampler2D uGloss;
uniform sampler2D uNormal;
uniform sampler2D uHeight;

varying vec3 vNormal;
varying vec2 vUV;
varying mat4 vRot;

void main () {
  vec3 faceDir    = (vRot * vec4(vNormal, 1.0)).xyz;
  float intensity = dot(vec3(-1.0, 1.0, -1.0), faceDir); 
  vec3 texColor   = texture2D(uDiffuse, vUV).xyz;
  vec4 color      = vec4(intensity * texColor, 1.0);
  gl_FragColor    = color;
} 
