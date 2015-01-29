var mat4             = require("gl-mat4")
var LoadedProgram    = require("./LoadedProgram")
var BufferedGeometry = require("./BufferedGeometry")

module.exports = Renderer

function Renderer (gl) {
  this.gl                 = gl
  this.transformMatrix    = mat4.create()
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

Renderer.prototype.addMesh = function (mesh) {
  
}

//TODO: This is probably the final API that flushes a draw list
Renderer.prototype.draw = function () {

}

//TODO: This is a temporary "immediate" style API before we implement a queue
Renderer.prototype.drawMesh = function (rotMat, modelMat, viewMat, projMat, mesh) {
  var gl               = this.gl
  var geometryName     = mesh.geometry.name
  var programName      = mesh.program.name
  var bufferedGeometry = this.bufferedGeometries[geometryName]
  var loadedProgram    = this.loadedPrograms[programName]

  updateTransMat(this.transformMatrix, modelMat, viewMat, projMat)

  if (loadedProgram !== this.boundProgram) {
    gl.useProgram(loadedProgram.glProgram)

    this.boundProgram = loadedProgram
    console.log("a new program was used")
  }

  gl.enableVertexAttribArray(loadedProgram.attributes.aPosition)
  gl.enableVertexAttribArray(loadedProgram.attributes.aNormal)
  gl.enableVertexAttribArray(loadedProgram.attributes.aUV)

  //gl.uniformMatrix4fv(loadedProgram.uniforms.uModelTransMatrix, false, transMat)
  //gl.uniformMatrix4fv(loadedProgram.uniforms.uModelScaleMatrix, false, scaleMat)
  gl.uniformMatrix4fv(loadedProgram.uniforms.uModelRotMatrix, false, rotMat)
  gl.uniformMatrix4fv(loadedProgram.uniforms.uModelMatrix, false, modelMat)
  gl.uniformMatrix4fv(loadedProgram.uniforms.uViewMatrix, false, viewMat)
  gl.uniformMatrix4fv(loadedProgram.uniforms.uProjectionMatrix, false, projMat)
  gl.uniformMatrix4fv(loadedProgram.uniforms.uTransformMatrix, false, this.transformMatrix)

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

function updateTransMat (out, modelMat, viewMat, projMat) {
  mat4.identity(out)
  mat4.multiply(out, projMat, viewMat)
  mat4.multiply(out, out, modelMat)
  return out
}
