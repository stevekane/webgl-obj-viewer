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
        var program = new Program(programSchema.name, results.vertex, results.fragment)
  
        cache.programs[program.name] = program
        cb(err, program)
      })
    }

  }
}

function loadTexture (cache) {
  return function (textureSchema, cb) {
    var cachedTexture = cache.textures[textureSchema.name]
    
    if (cachedTexture) {
      setTimeout(cb, 1, null, cachedTexture)
    }
    else {
      loadImage(textureSchema.path)(function (err, image) {
        var texture = new Texture(textureSchema.name, image)

        cache.textures[texture.name] = texture
        cb(err, texture)
      })
    }
  }
}

function loadTextures (cache, textureSchemas) {
  return function (cb) {
    async.map(textureSchemas, loadTexture(cache), cb)
  }
}

function loadAttributes (cache, path) {
  return function (cb) {
    loadString(path)(cb)
  }
}

function loadMeshSchema (cache) {
  return function (meshSchema, cb) {
    var cachedMesh = cache.meshes[meshSchema.name]

    if (cachedMesh) {
      setTimeout(cb, 1, null, cachedMesh) 
    }
    else {
      async.parallel({
        attributes: loadAttributes(cache, meshSchema.path),
        program:    loadProgram(cache, meshSchema.programSchema),
        textures:   loadTextures(cache, meshSchema.textureSchemas)
      }, function (err, results) {
        var mesh = new Mesh.fromObj(
          meshSchema.name,
          results.attributes,
          results.textures,
          results.program
        )
        cache.meshes[mesh.name] = mesh
        cb(err, mesh)
      })
    }
  }
}

function loadModelFromSchema (cache, modelSchema, cb) {
  async.map(modelSchema.meshSchemas, loadMeshSchema(cache), function (err, meshes) {
    var model = new Model(modelSchema.name, meshes)

    //TODO: cache whole model?
    cb(err, model)
  })
}
