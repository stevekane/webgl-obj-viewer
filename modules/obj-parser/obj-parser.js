module.exports.parse = parse

var splitFace = split.bind(null, "/")

function notEmpty (thing) {
  return thing.length !== 0
}

function split (token, array) {
  return array.split(token)
}

function tokenize (txt) {
  return txt.split(" ")
            .filter(notEmpty)
}

function pushAll (array, v1, v2, v3) {
  array.push(v1)
  array.push(v2)
  array.push(v3)
}

function parse (objTxt, cb) {
  var indices      = []
  var vertices     = []
  var normals      = []
  var uvs          = []
  var foundIndices = {}

  var lines = objTxt.split("\n")
                    .map(tokenize)
                    .filter(notEmpty)

  lines.forEach(function (line) {
    switch (line[0]) {
      case "v": {
        pushAll(vertices, +line[1], +line[2], +line[3])
        break; 
      } 
      case "vn": {
        pushAll(normals, +line[1], +line[2], +line[3])
        break; 
      } 
      case "vt": {
        pushAll(uvs, +line[1], +line[2], +line[3])
        break; 
      } 
      case "f": {
        var verts   = line.slice(1)
        var vertStr = ""

        for (var i = 0, vertCount = 3; i < vertCount; ++i) {
          vertStr = verts[i]

          if (foundIndices[vertStr]) {
              
          }
        }

        console.log(verts)
        break; 
      } 
    } 
  })

  cb(null, {
    indices:  indices,
    vertices: vertices,
    normals:  normals,
    uvs:      uvs 
  })
}
