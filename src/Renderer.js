var vec3             = require("gl-vec3")
var mat4             = require("gl-mat4")
var LoadedProgram    = require("./LoadedProgram")
var BufferedGeometry = require("./BufferedGeometry")

module.exports = Renderer

function MeshJob () {
  this.position = null
  this.rotation = null
  this.scale    = null
  this.camera   = null
  this.mesh     = null
}

function Renderer (gl) {
  this.gl                 = gl

  //each mesh render call sets these appropriately and sends to GPU
  this.translateMat       = mat4.create()
  this.rotationMat        = mat4.create()
  this.scaleMat           = mat4.create()
  this.modelMat           = mat4.create()
  this.viewMat            = mat4.create()
  this.projectionMat      = mat4.create()
  this.transformMat       = mat4.create()

  this.queuePointer       = 0
  this.queue              = [new MeshJob, new MeshJob, new MeshJob]

  this.loadedPrograms     = {}
  this.bufferedGeometries = {}
  this.boundGeometry      = null
  this.boundProgram       = null
  //TODO: TEXTURES is complex case...  implement
  this.bufferedTextures   = {}
}

Renderer.prototype.loadProgram = function (program) {
  this.loadedPrograms[program.name] = new LoadedProgram.fromProgram(this.gl, program)
}

Renderer.prototype.bufferGeometry = function (geometry) {
  this.bufferedGeometries[geometry.name] = new BufferedGeometry(this.gl, geometry)
}

Renderer.prototype.draw = function () {
  for (var i = 0; i < this.queuePointer; i++) {
    this.drawMesh(
      this.queue[i].position,
      this.queue[i].rotation,
      this.queue[i].scale,
      this.queue[i].camera,
      this.queue[i].mesh
    )
  } 
}

Renderer.prototype.queueMesh = function (position, rotation, scale, camera, mesh) {
  var job = this.queue[this.queuePointer]

  job.position = position
  job.rotation = rotation
  job.scale    = scale
  job.camera   = camera
  job.mesh     = mesh

  this.queuePointer++
}

Renderer.prototype.flushQueue = function () {
  this.queuePointer = 0
}

//as generic and flexible an interface as possible?
Renderer.prototype.drawMesh = function (position, rotation, scale, camera, mesh) {
  var gl               = this.gl
  var geometryName     = mesh.geometry.name
  var programName      = mesh.program.name
  var bufferedGeometry = this.bufferedGeometries[geometryName]
  var loadedProgram    = this.loadedPrograms[programName]

  this.viewMat       = camera.viewMatrix
  this.projectionMat = camera.projectionMatrix

  updateTranslationMatrix(position, this.translateMat)
  updateRotationMatrix(rotation, this.rotationMat)
  updateScaleMatrix(scale, this.scaleMat)
  updateModelMatrix(
    this.translateMat,
    this.scaleMat,
    this.rotationMat,
    this.modelMat
  )
  updateTransformMatrix(
    this.transformMat,
    this.modelMat, 
    this.viewMat, 
    this.projectionMat
  )

  if (loadedProgram !== this.boundProgram) {
    gl.useProgram(loadedProgram.glProgram)

    this.boundProgram = loadedProgram
    console.log("a new program was used")
  }

  gl.enableVertexAttribArray(loadedProgram.attributes.aPosition)
  gl.enableVertexAttribArray(loadedProgram.attributes.aNormal)
  gl.enableVertexAttribArray(loadedProgram.attributes.aUV)

  gl.uniformMatrix4fv(loadedProgram.uniforms.uModelTransMatrix, false, this.translateMat)
  gl.uniformMatrix4fv(loadedProgram.uniforms.uModelScaleMatrix, false, this.scaleMat)
  gl.uniformMatrix4fv(loadedProgram.uniforms.uModelRotMatrix, false, this.rotationMat)
  gl.uniformMatrix4fv(loadedProgram.uniforms.uModelMatrix, false, this.modelMat)
  gl.uniformMatrix4fv(loadedProgram.uniforms.uViewMatrix, false, this.viewMat)
  gl.uniformMatrix4fv(loadedProgram.uniforms.uProjectionMatrix, false, this.projectionMat)
  gl.uniformMatrix4fv(loadedProgram.uniforms.uTransformMatrix, false, this.transformMat)

  if (this.boundGeometry !== bufferedGeometry) {
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferedGeometry.vertices)
    gl.vertexAttribPointer(loadedProgram.attributes.aPosition, 3, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferedGeometry.normals)
    gl.vertexAttribPointer(loadedProgram.attributes.aNormal, 3, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferedGeometry.uvs)
    gl.vertexAttribPointer(loadedProgram.attributes.aUV, 2, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferedGeometry.indices)

    this.boundGeometry = bufferedGeometry
    console.log("a new geometry was buffered")
  }

  gl.drawElements(gl.TRIANGLES, bufferedGeometry.indexCount, gl.UNSIGNED_SHORT, 0)
}

function updateTransformMatrix (out, modelMat, viewMat, projMat) {
  mat4.identity(out)
  mat4.multiply(out, projMat, viewMat)
  mat4.multiply(out, out, modelMat)
  return out
}

function updateTranslationMatrix (position, transMat) {
  mat4.identity(transMat)  
  return mat4.translate(transMat, transMat, position)
}

function updateRotationMatrix (rotation, rotMat) {
  mat4.identity(rotMat)
  mat4.rotateX(rotMat, rotMat, rotation[0])
  mat4.rotateY(rotMat, rotMat, rotation[1])
  mat4.rotateZ(rotMat, rotMat, rotation[2])
  return rotMat
}

function updateScaleMatrix (scale, scaleMat) {
  return scaleMat
}

function updateModelMatrix (transMat, scaleMat, rotMat, modelMat) {
  mat4.identity(modelMat)
  mat4.multiply(modelMat, transMat, scaleMat)
  return mat4.multiply(modelMat, modelMat, rotMat)
}
