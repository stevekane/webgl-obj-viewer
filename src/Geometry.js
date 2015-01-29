var OBJ      = require("webgl-obj-loader")

module.exports = Geometry

function Geometry (name, vertices, normals, uvs, indices) {
  this.name     = name
  this.vertices = new Float32Array(vertices)
  this.indices  = new Uint16Array(indices)
  this.normals  = new Float32Array(normals)
  this.uvs      = new Float32Array(uvs)
}

Geometry.fromObjStr = function (name, objStr) {
  var objBlob = new OBJ.Mesh(objStr)

  return new Geometry(
    name, 
    normalize(center(objBlob.vertices)),
    objBlob.vertexNormals,
    objBlob.textures,
    objBlob.indices
  )
}

//MUTATES IN PLACE!
function normalize (array) {
  var len    = array.length
  var minVal = 0
  var maxVal = 0
  var diff   = 0
  //find min and max
  for (var i = 0; i < len; ++i) {
    minVal = array[i] < minVal ? array[i] : minVal
    maxVal = array[i] > maxVal ? array[i] : maxVal
  }

  diff = maxVal - minVal

  //mutate array by dividing by diff
  for (var j = 0; j < array.length; ++j) {
    array[j] /= diff 
  }
  return array
}

//MUTATES IN PLACE!
function center (array) {
  var len     = array.length
  var minX    = 0
  var minY    = 0
  var minZ    = 0
  var maxX    = 0
  var maxY    = 0
  var maxZ    = 0
  var centerX = 0
  var centerY = 0
  var centerZ = 0

  for (var i = 0; i < len; i+=3) {
    minX = array[i]   < minX ? array[i]   : minX
    minY = array[i+1] < minY ? array[i+1] : minY
    minZ = array[i+2] < minZ ? array[i+2] : minZ

    maxX = array[i]   > maxX ? array[i]   : maxX
    maxY = array[i+1] > maxY ? array[i+1] : maxY
    maxZ = array[i+2] > maxZ ? array[i+2] : maxZ
  }

  centerX = (maxX + minX) / 2
  centerY = (maxY + minY) / 2
  centerZ = (maxZ + minZ) / 2

  for (var j = 0; j < len; j+=3) {
    array[j]   -= centerX
    array[j+1] -= centerY
    array[j+2] -= centerZ
  }
  return array
}




