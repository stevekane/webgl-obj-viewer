var async           = require("async")
var Mesh            = require("./Mesh")
var Model           = require("./Model")
var Program         = require("./Program")
var Texture         = require("./Texture")
var fns             = require("./functions")
var pluck           = fns.pluck

module.exports.loadModelFromSchema = loadModelFromSchema

function loadXHR (type) {
  return function (filePath) {
    return function (cb) {
      var req = new XMLHttpRequest

      req.responseType = type
      req.onerror      = function (err) { return cb(err) }
      req.onload       = function () { return cb(null, req.response) }
      req.open("GET", filePath, true)
      req.send(null)
    }
  }
}

var loadJSON   = loadXHR("json")
var loadBuffer = loadXHR("arrayBuffer")
var loadString = loadXHR("string")

function loadImage (filePath) {
  return function (cb) {
    var img = new Image

    img.onload  = function () { return cb(null, img) }
    img.onerror = function (err) { return cb(err) }
    img.src     = filePath
  }
}

function loadProgram (cache, programSchema) {
  return function (cb) {
    var cachedProgram = cache.programs[programSchema.name]

    if (cachedProgram) {
      setTimeout(cb, 1, null, cachedProgram)
    } 
    else {
      async.parallel({
        vertex:   loadString(programSchema.vertex),
        fragment: loadString(programSchema.fragment)
      }, function (err, results) {
        var program = new Program(programSchema.name, results.vertex, results.fragment))

        return cb(err, program)
      })
    }

  }
}

function loadTexture (cache, textureSchema) {
  return function (name) {

  }
  return function (cb) {
              
  }
}

function loadTextures (cache, textureSchemas) {
  return function (cb) {
    var textureNames = pluck("name", textureSchemas)

    async.each(textureNames, loadTexture
  }
}

function loadAttributes (cache, path) {
  return function (cb) {
    loadString(path, cb)
  }
}

function loadMeshSchemaDependencies (cache, meshSchema) {
  return function (cb) {
    var textureLoads = []
    
    async.parallel({
      attributes: loadAttributes(cache, meshSchema.path),
      program:    loadProgram(cache, meshSchema.programSchema.path),
      textures:   loadTextures(cache, meshSchema.textureSchemas)
    }, function (err, results) {

    })  
  }
}

function loadMeshShema (cache, meshSchema) {
  return function (cb) {
    var cachedMesh = cache.meshes[meshSchema.name]

    if (cachedMesh) {
      setTimeout(cb, 1, null, cachedMesh) 
    }
    else {
      //implement
    }
  }
}

function loadModelFromSchema (cache, modelSchema, cb) {
  setTimeout(cb, 1) 
}
