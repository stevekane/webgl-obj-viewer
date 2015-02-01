var mat4                = require("gl-mat4")
var vec3                = require("gl-vec3")
var Clock               = require("./Clock")
var Camera              = require("./Camera")
var Cache               = require("./Cache")
var Renderer            = require("./Renderer")
var glUtils             = require("./gl-utils")
var Loader              = require("./Loader")
var Assemblages         = require("./Assemblages")
var capsuleSchema       = require("./capsuleSchema.json")
var loadModelFromSchema = Loader.loadModelFromSchema
var bufferModels        = glUtils.bufferModels
var bufferMesh          = glUtils.bufferMesh
var Renderable          = Assemblages.Renderable
var canvas              = document.getElementById("canvas")
var gl                  = canvas.getContext("webgl")

var clock       = new Clock
var cache       = new Cache
var camera      = new Camera(canvas, 0, 0, -3.5, 0, 0, 0)
var renderer    = new Renderer(gl)
var renderables = []

function makeRender () {
  gl.enable(gl.BLEND)
  gl.enable(gl.CULL_FACE)
  gl.enable(gl.DEPTH_TEST)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(1.0, 1.0, 1.0, 1.0)
  gl.colorMask(true, true, true, true)

  //TODO: This is a temporary placeholder "scale matrix".   not yet implemented in game
  var scale = [1,1,1]

  return function render () {
    var ent
    var modelMat
    var viewMat
    var projMat

    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    for (var i = 0, len = renderables.length; i < len; i++) {
      ent      = renderables[i]
      modelMat = ent.physics.modelMat
      viewMat  = camera.viewMatrix 
      projMat  = camera.projectionMatrix
        
      for (var j = 0, meshCount = ent.model.meshes.length; j < meshCount; j++) {
        renderer.queueMesh(
          ent.physics.position,
          ent.physics.rotation,
          scale, //from above, temporary
          camera,
          ent.model.meshes[j]
        )
      }
    }
    renderer.draw()
    renderer.flushQueue()
    requestAnimationFrame(render) 
  }
}

function makeUpdate () {
  return function update () {
    renderables[0].physics.rotation[0] += (Math.PI / 180) % (Math.PI * 2)
    clock.tick()
  }
}

function boot () {
  canvas.width  = 600
  canvas.height = 600
  requestAnimationFrame(makeRender())
  setInterval(makeUpdate(), 25)
}

function init () {
  loadModelFromSchema(cache, capsuleSchema, function (err, model) {
    var capsules = [new Renderable(model, 1, 0, 0), new Renderable(model, -1, -1, 0)]
    var mesh
    var texture

    for (var j = 0; j < capsules.length; j++) {
      capsule = capsules[j]
      for (var i = 0; i < capsule.model.meshes.length; i++) {
        mesh = capsule.model.meshes[i]

        renderer.loadProgram(mesh.program)
        renderer.bufferGeometry(mesh.geometry)

        for (var k = 0; k < mesh.textures.length; k++) {
          texture = mesh.textures[k]

          renderer.uploadTexture(texture)
        }
      }  
      renderables.push(capsule)
    }
  
    if (err) return console.log(err)
    else            boot()
  })
}

window.onload = init
