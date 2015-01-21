var mat4                = require("gl-mat4")
var vec3                = require("gl-vec3")
var OBJ                 = require("webgl-obj-loader")
var Clock               = require("./Clock")
var Camera              = require("./Camera")
var glUtils             = require("./gl-utils")
var Loader              = require("./Loader")
var ModelSchema         = require("./ModelSchema")
var loadModelFromSchema = Loader.loadModelFromSchema
var canvas              = document.getElementById("canvas")
var gl                  = canvas.getContext("webgl")
var program             = glUtils.Program.fromDomNodes(gl, "vertex", "fragment")
var cubeMesh            = document.getElementById("my_cube.obj").innerHTML

var monkeySchema = new ModelSchema("monkey", {head: "/meshes/suzanne.obj"}, {})

var clock  = new Clock
var camera = new Camera(canvas, 0, 0, -1.4, 0, 0, 0)
var cache = {
  models: {}
}

function loadAssets (assetHash, cb) {
  OBJ.downloadMeshes(assetHash.meshes, function (meshes) { 
    cb(null, {meshes: meshes}) 
  })
}

function makeRender () {
  var mesh     = cache.models.monkey.meshes.head

  var modelTrans = vec3.fromValues(0, 0, 0)
  var modelScale = vec3.fromValues(1, 1, 1)
  var modelRot   = vec3.fromValues(0, Math.PI / 200, 0)

  var modelTransMat = mat4.create()
  var modelScaleMat = mat4.create()
  var modelRotMat   = mat4.create()
  var modelMat      = mat4.create()
  var viewMat       = mat4.create()
  var projMat       = mat4.create()
  var normalMat     = mat4.create()

  var indexBuffer = gl.createBuffer()

  gl.useProgram(program.program)
  gl.enable(gl.BLEND)
  gl.enable(gl.CULL_FACE)
  gl.enable(gl.DEPTH_TEST)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(1.0, 1.0, 1.0, 1.0)
  gl.colorMask(true, true, true, true)

  return function render () {
    mat4.translate(modelTransMat, modelTransMat, modelTrans)
    mat4.scale(modelScaleMat, modelScaleMat, modelScale)
    mat4.rotateX(modelRotMat, modelRotMat, modelRot[0])
    mat4.rotateY(modelRotMat, modelRotMat, modelRot[1])
    mat4.rotateZ(modelRotMat, modelRotMat, modelRot[2])

    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.uniformMatrix4fv(program.uniforms.uModelTransMatrix, false, modelTransMat)
    gl.uniformMatrix4fv(program.uniforms.uModelScaleMatrix, false, modelScaleMat)
    gl.uniformMatrix4fv(program.uniforms.uModelRotMatrix, false, modelRotMat)
    gl.uniformMatrix4fv(program.uniforms.uViewMatrix, false, camera.viewMatrix)
    gl.uniformMatrix4fv(program.uniforms.uProjectionMatrix, false, camera.projectionMatrix)
    program.updateBuffer(gl, "aPosition", 3, mesh.vertices)
    program.updateBuffer(gl, "aNormal", 3, mesh.normals)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.DYNAMIC_DRAW)
    gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0)
    requestAnimationFrame(render) 
  }
}

function makeUpdate () {
  return function update () {
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
  loadModelFromSchema(monkeySchema, function (err, model) {
    cache.models[model.name] = model

    if (err) return console.error(err)
    else            boot(cache)
  })
}

window.onload = init
