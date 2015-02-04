var mat4                     = require("gl-mat4")
var webglew                  = require("webglew")
var Program                  = require("./Program")
var LoadedProgram            = require("./LoadedProgram")
var BufferedGeometry         = require("./BufferedGeometry")
var LoadedTexture            = require("./LoadedTexture")
var RenderQueue              = require("./RenderQueue")
var matrixUtils              = require("./matrix-utils")
var computeTransformMatrix   = matrixUtils.computeTransformMatrix
var computeTranslationMatrix = matrixUtils.computeTranslationMatrix
var computeRotationMatrix    = matrixUtils.computeRotationMatrix
var computeScaleMatrix       = matrixUtils.computeScaleMatrix
var computeModelMatrix       = matrixUtils.computeModelMatrix

var vs = [
"attribute vec3 aPosition;",
"attribute vec2 aUV;",
"attribute vec3 aNormal;",
"",
"uniform mat4 uModelTransMatrix;",
"uniform mat4 uModelScaleMatrix;",
"uniform mat4 uModelRotMatrix;",
"uniform mat4 uModelMatrix;",
"uniform mat4 uViewMatrix;",
"uniform mat4 uProjectionMatrix;",
"uniform mat4 uTransformMatrix;",
"",
"varying vec3 vNormal;",
"varying vec2 vUV;",
"varying mat4 vRot;",
"",
"void main () {",
"  vNormal     = aNormal;",
"  vUV         = aUV;",
"  vRot        = uModelRotMatrix;",
"  gl_Position = uTransformMatrix * vec4(aPosition, 1);",
"}"
].join("\n")

var fs = [
"precision highp float;",
"",
"uniform sampler2D uDiffuse;",
"uniform sampler2D uAmbient;",
"uniform sampler2D uSpecularity;",
"uniform sampler2D uGloss;",
"uniform sampler2D uNormal;",
"uniform sampler2D uHeight;",
"",
"varying vec3 vNormal;",
"varying vec2 vUV;",
"varying mat4 vRot;",
"",
"void main () {",
"  vec3 light      = vec3(2.0, 2.0, 2.0);",
"  vec3 faceDir    = (vRot * vec4(vNormal, 1.0)).xyz;",
"  float intensity = dot(light, faceDir);",
"  vec3 texColor   = texture2D(uDiffuse, vUV).xyz;",
"  vec4 color      = vec4(intensity * texColor, 1.0);",
"  gl_FragColor    = color;",
"}",
].join("\n")

module.exports = PBRRenderer

function PBRRenderer (gl) {
  var program         = new Program("pbr", vs, fs)
  var loadedProgram   = new LoadedProgram.fromProgram(gl, program)  
  var queue           = new RenderQueue(2000)

  gl.useProgram(loadedProgram.glProgram)
  gl.enable(gl.BLEND)
  gl.enable(gl.CULL_FACE)
  gl.enable(gl.DEPTH_TEST)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(1.0, 1.0, 1.0, 1.0)
  gl.colorMask(true, true, true, true)

  //refernce to gl context and wrapper for extensions
  this.gl                 = gl
  this.webglew            = webglew(gl)

  //here we store "cached" buffers by string name for textures and geometries
  this.bufferedGeometries = {}
  this.loadedTextures     = {}

  //increment this to ensure that all loaded textures have unique texture unit
  //start at 4 so that 0-3 can be used as framebuffers?
  this.textureUnitPointer = 4

  //we need to store references to relevant current bound state
  //this helps us avoid swapping gl state when not needed
  //we store a reference to the currently loadedProgram
  //we store a reference to the currently bound geometry
  //we store a reference to the currently bound textures BY location!
  this.loadedProgram      = loadedProgram
  this.boundGeometry      = null
  this.textureChannels    = {}

  //these are set during mesh calculations and are uploaded to the GPU per mesh
  this.translateMat       = mat4.create()
  this.rotationMat        = mat4.create()
  this.scaleMat           = mat4.create()
  this.modelMat           = mat4.create()
  this.viewMat            = mat4.create()
  this.projectionMat      = mat4.create()
  this.transformMat       = mat4.create()

  //this is the render queue.  it is populated with empty meshjobs
  this.queue              = queue

  //TODO: for debugging
  window.r = this
} 

PBRRenderer.prototype.bufferGeometry = function (geometry) {
  if (this.bufferedGeometries[geometry.name]) return
  this.bufferedGeometries[geometry.name] = new BufferedGeometry(this.gl, geometry)
}

PBRRenderer.prototype.loadTexture = function (texture) {
  if (this.loadedTextures[texture.name]) return
  this.loadedTextures[texture.name] = new LoadedTexture(
    this.gl, 
    this.webglew,
    this.textureUnitPointer, 
    texture
  )
  this.textureUnitPointer++
}

PBRRenderer.prototype.draw = function (camera) {
  var gl = this.gl
  var meshJob

  gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

  this.viewMat       = camera.viewMatrix
  this.projectionMat = camera.projectionMatrix

  //sortRenderQueue(this.queue)
  while (meshJob = this.queue.pop()) {
    renderMeshJob(this, camera, meshJob)
  }
}

function sortRenderQueue (queue) {
  return queue
}

function renderMeshJob (renderer, camera, meshJob) {
  var gl               = renderer.gl
  var mesh             = meshJob.mesh
  var geometryName     = mesh.geometry.name
  var boundGeometry    = renderer.boundGeometry
  var bufferedGeometry = renderer.bufferedGeometries[geometryName]
  var loadedProgram    = renderer.loadedProgram
  var targetTexture
  var glTexture
  var uLocation
  var textureUnit

  computeTranslationMatrix(meshJob.position, renderer.translateMat)
  computeRotationMatrix(meshJob.rotation, renderer.rotationMat)
  computeScaleMatrix(meshJob.scale, renderer.scaleMat)
  computeModelMatrix(
    renderer.translateMat,
    renderer.scaleMat,
    renderer.rotationMat,
    renderer.modelMat
  )
  computeTransformMatrix(
    renderer.transformMat,
    renderer.modelMat, 
    renderer.viewMat, 
    renderer.projectionMat
  )

  gl.uniformMatrix4fv(loadedProgram.uniforms.uModelTransMatrix, false, renderer.translateMat)
  gl.uniformMatrix4fv(loadedProgram.uniforms.uModelScaleMatrix, false, renderer.scaleMat)
  gl.uniformMatrix4fv(loadedProgram.uniforms.uModelRotMatrix, false, renderer.rotationMat)
  gl.uniformMatrix4fv(loadedProgram.uniforms.uModelMatrix, false, renderer.modelMat)
  gl.uniformMatrix4fv(loadedProgram.uniforms.uViewMatrix, false, renderer.viewMat)
  gl.uniformMatrix4fv(loadedProgram.uniforms.uProjectionMatrix, false, renderer.projectionMat)
  gl.uniformMatrix4fv(loadedProgram.uniforms.uTransformMatrix, false, renderer.transformMat)

  for (var t = 0; t < mesh.textures.length; t++) {
    targetTexture = mesh.textures[t]
    glTexture     = renderer.loadedTextures[targetTexture.name]
    uLocation     = loadedProgram.uniforms[targetTexture.channel]
    textureUnit   = glTexture.textureUnit

    gl.activeTexture(gl.TEXTURE0 + textureUnit)
    gl.bindTexture(gl.TEXTURE_2D, glTexture.glTexture)
    gl.uniform1i(uLocation, textureUnit)
  }

  if (boundGeometry !== bufferedGeometry) {
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferedGeometry.vertices)
    gl.vertexAttribPointer(loadedProgram.attributes.aPosition, 3, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferedGeometry.normals)
    gl.vertexAttribPointer(loadedProgram.attributes.aNormal, 3, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferedGeometry.uvs)
    gl.vertexAttribPointer(loadedProgram.attributes.aUV, 2, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferedGeometry.indices)

    renderer.boundGeometry = bufferedGeometry
    console.log("a new geometry was buffered")
  }
  gl.drawElements(gl.TRIANGLES, bufferedGeometry.indexCount, gl.UNSIGNED_SHORT, 0)
}
