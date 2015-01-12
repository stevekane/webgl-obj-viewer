var mat4    = require("gl-mat4")
var vec3    = require("gl-vec3")
var OBJ     = require("webgl-obj-loader")
var Clock   = require("./Clock")
var Camera  = require("./Camera")
var glUtils = require("./gl-utils")
var canvas  = document.getElementById("canvas")
var gl      = canvas.getContext("webgl")
var program = glUtils.Program.fromDomNodes(gl, "vertex", "fragment")

var requiredAssets = {
  meshes: {
    pumpkin: "/meshes/pumpkin_tall_10k.obj" 
  }
}

var clock  = new Clock
var camera = new Camera(0, 0, 2.5, 0, 0, 0)
var cache = {
  meshes:   {},
  textures: {}
}

function loadAssets (assetHash, cb) {
  OBJ.downloadMeshes(assetHash.meshes, function (meshes) { 
    cb(null, {meshes: meshes}) 
  })
}

function makeRender () {
  var modelMat   = mat4.create()
  var viewMat    = mat4.create()
  var projMat    = mat4.create()
  var modelTrans = vec3.fromValues(0, 0, 0)
  var viewTrans  = vec3.fromValues(
    camera.position[0], 
    camera.position[1], 
    camera.position[2]
  )

  mat4.translate(modelMat, modelMat, modelTrans)

  gl.useProgram(program.program)
  gl.enable(gl.BLEND)
  gl.enable(gl.CULL_FACE)
  gl.enable(gl.DEPTH_TEST)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(1.0, 1.0, 0.5, 1.0)
  gl.colorMask(true, true, true, true)

  return function render () {
    gl.clear(gl.COLOR_BUFFER_BIT)
    requestAnimationFrame(render) 
  }
}

function makeUpdate () {
  return function update () {
    clock.tick()
  }
}

function boot () {
  requestAnimationFrame(makeRender())
  setInterval(makeUpdate(), 25)
}

function init () {
  loadAssets(requiredAssets, function (err, assets) {
    cache.meshes = assets.meshes

    if (err) return console.error(err)
    else            boot(cache)
  })
}

window.onload = init
