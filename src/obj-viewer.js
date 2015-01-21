var mat4     = require("gl-mat4")
var vec3     = require("gl-vec3")
var OBJ      = require("webgl-obj-loader")
var Clock    = require("./Clock")
var Camera   = require("./Camera")
var glUtils  = require("./gl-utils")
var canvas   = document.getElementById("canvas")
var gl       = canvas.getContext("webgl")
var program  = glUtils.Program.fromDomNodes(gl, "vertex", "fragment")
var cubeMesh = document.getElementById("my_cube.obj").innerHTML

var requiredAssets = {
  meshes: {
    pumpkin:  "/meshes/pumpkin_tall_10k.obj",
    teapot:   "/meshes/teapot.obj",
    suzanne:  "/meshes/suzanne.obj",
    vanquish: "/meshes/vanquish.obj",
    cube:     "/meshes/cube.obj"
  }
}

var clock  = new Clock
var camera = new Camera(canvas, 0, 0, -1.4, 0, 0, 0)
var cache = {
  meshes:   {},
  textures: {}
}

function loadAssets (assetHash, cb) {
  OBJ.downloadMeshes(assetHash.meshes, function (meshes) { 
    cb(null, {meshes: meshes}) 
  })
}

function normalize (array) {
  var len    = array.length
  var minVal = 0
  var maxVal = 0
  var diff   = 0

  //find min and max
  for (var i = 0; i < len; ++i) {
    minVal = array[i] < minVal ? array[i] : minVal
    maxVal = array[i] > maxVal ? array[i] : maxVal
  }

  diff = maxVal - minVal

  //mutate array by dividing by diff
  for (var j = 0; j < array.length; ++j) {
    array[j] /= diff 
  }
  return array
}

function center (array) {
  var len     = array.length
  var minX    = 0
  var minY    = 0
  var minZ    = 0
  var maxX    = 0
  var maxY    = 0
  var maxZ    = 0
  var centerX = 0
  var centerY = 0
  var centerZ = 0

  for (var i = 0; i < len; i+=3) {
    minX = array[i]   < minX ? array[i]   : minX
    minY = array[i+1] < minY ? array[i+1] : minY
    minZ = array[i+2] < minZ ? array[i+2] : minZ

    maxX = array[i]   > maxX ? array[i]   : maxX
    maxY = array[i+1] > maxY ? array[i+1] : maxY
    maxZ = array[i+2] > maxZ ? array[i+2] : maxZ
  }

  centerX = maxX - minX 
  centerY = maxY - minY
  centerZ = maxZ - minZ

  for (var j = 0; j < len; j+=3) {
    array[j]   -= centerX
    array[j+1] -= centerY
    array[j+2] -= centerZ
  }
  return array
}

function makeRender () {
  var mesh     = cache.meshes.suzanne
  var vertices = new Float32Array(center(normalize(mesh.vertices)))
  var indices  = new Uint16Array(mesh.indices)
  var normals  = new Float32Array(mesh.vertexNormals)

  var modelTrans = vec3.fromValues(0, 0, 0)
  var modelScale = vec3.fromValues(1, 1, 1)
  var modelRot   = vec3.fromValues(Math.PI / 200 , 0, 0)

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
    program.updateBuffer(gl, "aPosition", 3, vertices)
    program.updateBuffer(gl, "aNormal", 3, normals)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.DYNAMIC_DRAW)
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)
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
  loadAssets(requiredAssets, function (err, assets) {
    cache.meshes = assets.meshes

    if (err) return console.error(err)
    else            boot(cache)
  })
}

window.onload = init
