attribute vec3 aPosition;
attribute vec2 aUV;
attribute vec3 aNormal;

uniform mat4 uModelTransMatrix;
uniform mat4 uModelScaleMatrix;
uniform mat4 uModelRotMatrix;
uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uTransformMatrix;

varying vec3 vNormal;
varying vec2 vUV;
varying mat4 vRot;

void main () {
  vNormal     = aNormal; 
  vUV         = aUV;
  vRot        = uModelRotMatrix;
  gl_Position = uTransformMatrix * vec4(aPosition, 1);
}       
