var fs       = require("fs")
var parseObj = require("parse-obj")

function flattenAs (Type, arrayOfArrays) {
  var flattened = []

  for (var i = 0, len = arrayOfArrays.length; i < len; ++i) {
    for (var j = 0; j < arrayOfArrays[i].length; ++j) {
      flattened.push(arrayOfArrays[i][j]) 
    }
  }

  return new Type(flattened)
}

var flattenTyped    = flattenAs.bind(null, Float32Array)
var flattenShortInt = flattenAs.bind(null, Uint16Array)

function buildMeshAttrs (fileName, cb) {
  parseObj(fs.createReadStream(fileName), function (err, res) {
    if (err) return cb(err)
    
    cb(null, res)
    //cb(null, {
    //  vPositions: flattenTyped(res.vertexPositions),
    //  vNormals:   flattenTyped(res.vertexNormals),
    //  vUVs:       flattenTyped(res.vertexUVs),
    //  fPositions: flattenTyped(res.facePositions),
    //  fNormals:   flattenTyped(res.faceNormals),
    //  fUVs:       flattenTyped(res.faceUVs)
    //})
  })
}

buildMeshAttrs("public/meshes/vanquish.obj", function (err, res) {
  fs.writeFile("public/json/vanquish.json", JSON.stringify(res))
})
