var mat4 = require("gl-mat4")

module.exports = Renderer

function Renderer (gl) {
  this.gl              = gl
  this.transformMatrix = mat4.create()
}
