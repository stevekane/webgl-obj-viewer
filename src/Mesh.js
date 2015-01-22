var OBJ       = require("webgl-obj-loader")
var helpers   = require("./obj-helpers")
var center    = helpers.center
var normalize = helpers.normalize

module.exports = Mesh

function Mesh (objStr) {
  var mesh = new OBJ.Mesh(objStr)

  this.vertices = new Float32Array(normalize(center(mesh.vertices)))
  this.indices  = new Uint16Array(mesh.indices)
  this.normals  = new Float32Array(mesh.vertexNormals)
  this.uvs      = new Float32Array(mesh.textures)
}
