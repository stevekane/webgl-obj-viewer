var OBJ       = require("webgl-obj-loader")
var helpers   = require("./obj-helpers")
var center    = helpers.center
var normalize = helpers.normalize

module.exports = Mesh

function Mesh (objStr) {
  var mesh = new OBJ.Mesh(objStr)

  mesh.vertices = new Float32Array(center(normalize(mesh.vertices)))
  mesh.indices  = new Uint16Array(mesh.indices)
  mesh.normals  = new Float32Array(mesh.vertexNormals)
  return mesh
}
