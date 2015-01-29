var mat4             = require("gl-mat4")
var LoadedProgram    = require("./LoadedProgram")
var BufferedGeometry = require("./BufferedGeometry")

module.exports = Renderer

function Renderer (gl) {
  this.gl                 = gl
  this.transformMatrix    = mat4.create()
  this.loadedPrograms     = {}
  this.bufferedGeometries = {}
  //TODO: TEXTURES is complex case...  implement
  this.bufferedTextures   = {}
}

Renderer.prototype.loadProgram = function (program) {
  this.loadedPrograms[program.name] = new LoadedProgram.fromProgram(this.gl, program)
}

Renderer.prototype.bufferGeometry = function (geometry) {
  this.bufferedGeometries[geometry.name] = new BufferedGeometry(this.gl, geometry)
}
