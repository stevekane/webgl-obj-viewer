var OBJ       = require("webgl-obj-loader")
var helpers   = require("./obj-helpers")
var center    = helpers.center
var normalize = helpers.normalize

module.exports = Mesh

function Mesh (name, attributes, textures, program) {
  this.name       = name
  this.attributes = attributes
  this.textures   = textures
  this.program    = program
}

Mesh.fromObj = function (name, objStr, textures, program) {
  var mesh = new OBJ.Mesh(objStr)

  this.name       = name
  this.attributes = [
    {name: "vertices", data: new Float32Array(normalize(center(mesh.vertices)))},
    {name: "indices",  data: new Uint16Array(mesh.indices)},
    {name: "normals",  data: new Float32Array(mesh.vertexNormals)},
    {name: "uvs",      data: new Float32Array(mesh.textures)}
  ]
  this.program  = program
  this.textures = textures
}
