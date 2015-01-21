var fs       = require("fs")
var path     = require("path")
var test     = require("tape")
var mod      = require("./obj-parser")
var filePath = path.join(__dirname, "cube.obj")
var cubeObj  = fs.readFileSync(filePath, {encoding: "utf8"})

test("values returned are correct", function (t) {
  t.plan(3)
  var expectedCubeVerts = [ 
    0.0, 0.0, 0.0,
    0.0, 0.0, 1.0,
    0.0, 1.0, 0.0,
    0.0, 1.0, 1.0,
    1.0, 0.0, 0.0,
    1.0, 0.0, 1.0,
    1.0, 1.0, 0.0,
    1.0, 1.0, 1.0 
  ]

  var expectedCubeNormals = [
    0.0, 0.0, 1.0,
    0.0 ,0.0, -1.0,
    0.0, 1.0, 0.0,
    0.0, -1.0, 0.0,
    1.0, 0.0, 0.0,
    -1.0, 0.0, 0.0 
  ]

  var expectedCubeUVs = [
  
  ]

  mod.parse(cubeObj, function (err, results) {
    t.same(expectedCubeVerts, results.vertices, "correct vertices returned")
    t.same(expectedCubeNormals, results.normals, "correct normals returned")
    t.same(expectedCubeUVs, results.uvs, "correct normals returned")
  })
})
