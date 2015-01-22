var async           = require("async")
var objHelpers      = require("./obj-helpers")
var Mesh            = require("./Mesh")
var Model           = require("./Model")
var fns             = require("./functions")
var center          = objHelpers.center
var normalize       = objHelpers.normalize
var parallel        = async.parallel
var apply           = async.apply
var transformValues = fns.transformValues

module.exports.loadModelFromSchema = loadModelFromSchema

function loadXHR (type) {
  return function loadTypedXHR (filePath, cb) {
    var req = new XMLHttpRequest

    req.responseType = type
    req.onerror      = function (err) { return cb(err) }
    req.onload       = function () { return cb(null, req.response) }
    req.open("GET", filePath, true)
    req.send(null)
  }
}

var loadJSON   = loadXHR("json")
var loadBuffer = loadXHR("arrayBuffer")
var loadString = loadXHR("string")

function loadMesh (filePath, cb) {
  loadString(filePath, function (err, objStr) {
    return cb(null, new Mesh(objStr))
  })  
}

//TODO: not implemented or in use at the moment
function loadImage (filePath, cb) {
  var img = new Image

  img.onload  = function () { return cb(null, img) }
  img.onerror = function (err) { return cb(err) }
  img.src     = filePath
}

function createLoads (fn, hash) {
  var keys = Object.keys(hash)
  var len  = keys.length
  var out  = {}

  for (var i = 0; i < len; ++i) {
    out[keys[i]] = apply(fn, hash[keys[i]])
  }
  return out
}

function loadModelFromSchema (modelSchema, cb) {
  var meshLoads    = createLoads(loadMesh, modelSchema.meshNames)
  var textureLoads = createLoads(loadImage, modelSchema.textureNames)
  var loadMeshes   = apply(parallel, meshLoads)
  var loadTextures = apply(parallel, textureLoads)

  parallel({
    meshes:   loadMeshes,
    textures: loadTextures
  }, function (err, results) {
    return cb(null, new Model(modelSchema.name, results.meshes, results.textures))
  })
}
