var Clock               = require("./Clock")
var Camera              = require("./Camera")
var Cache               = require("./Cache")
var Renderer            = require("./Renderer")
var PBRRenderer         = require("./PBRRenderer")
var glUtils             = require("./gl-utils")
var Loader              = require("./Loader")
var Assemblages         = require("./Assemblages")
var capsuleSchema       = require("./capsuleSchema.json")
var loadModelFromSchema = Loader.loadModelFromSchema
var Renderable          = Assemblages.Renderable
var canvas              = document.getElementById("canvas")
var gl                  = canvas.getContext("webgl")

var clock       = new Clock
var cache       = new Cache
var camera      = new Camera(canvas, 0, 0, -3, 0, 0, 0)
var pbrRenderer = new PBRRenderer(gl)
var renderables = []

function makeRender () {
  //TODO: This is a temporary placeholder "scale matrix".   not yet implemented
  var scale = [1,1,1]

  return function render () {
    var ent

    for (var i = 0, len = renderables.length; i < len; i++) {
      ent = renderables[i]
        
      for (var j = 0, meshCount = ent.model.meshes.length; j < meshCount; j++) {
        pbrRenderer.queue.push(
          ent.physics.position,
          ent.physics.rotation,
          scale, //TODO: should be on entity eventually
          ent.model.meshes[j]
        )
      }
    }
    pbrRenderer.draw(camera)
    requestAnimationFrame(render) 
  }
}

function makeUpdate () {
  return function update () {
    for (var i = 0; i < renderables.length; i++) {
      renderables[i].physics.rotation[0] += (Math.PI / 180) % (Math.PI * 2)
      renderables[i].physics.rotation[1] += (Math.PI / 180) % (Math.PI * 2)
      renderables[i].physics.rotation[2] += (Math.PI / 180) % (Math.PI * 2)
    }
    camera.position[2] -= .01
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
    var mesh
    var texture

    renderables.push(new Renderable(model, 0, 0, 0))
    renderables.push(new Renderable(model, 1, 1, 1))
    renderables.push(new Renderable(model, -1, -1, -1))

    for (var j = 0; j < renderables.length; j++) {
      renderable = renderables[j]

      for (var i = 0; i < renderable.model.meshes.length; i++) {
        mesh = renderable.model.meshes[i]

        pbrRenderer.bufferGeometry(mesh.geometry)
        for (var k = 0; k < mesh.textures.length; k++) {
          texture = mesh.textures[k]

          pbrRenderer.loadTexture(texture)
        }
      }  
    }
  
    if (err) return console.log(err)
    else            boot()
  })
}

window.onload = init
