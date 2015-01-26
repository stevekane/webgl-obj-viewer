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
var program             = glUtils.Program.fromDomNodes(gl, "vertex", "fragment")

var clock       = new Clock
var cache       = new Cache
var camera      = new Camera(canvas, 0, 0, -3.5, 0, 0, 0)
var renderer    = new Renderer(gl)
var renderables = []

function updateTransMat (out, modelMat, viewMat, projMat) {
  mat4.identity(out)
  mat4.multiply(out, projMat, viewMat)
  mat4.multiply(out, out, modelMat)
  return out
}

function renderModel (renderer, camera, entity) {
  var transMat        = entity.physics.transMat
  var scaleMat        = entity.physics.scaleMat
  var rotMat          = entity.physics.rotMat
  var modelMat        = entity.physics.modelMat
  var viewMat         = camera.viewMatrix
  var projMat         = camera.projectionMatrix
  var transMat        = renderer.transformMatrix
  var bufferedMesh    = entity.bufferedModel.meshBuffers.main
  var bufferedTexture = entity.bufferedModel.textureBuffers.main

  updateTransMat(
    renderer.transformMatrix, 
    entity.physics.modelMat, 
    camera.viewMatrix, 
    camera.projectionMatrix
  )

  gl.uniformMatrix4fv(program.uniforms.uModelTransMatrix, false, transMat)
  gl.uniformMatrix4fv(program.uniforms.uModelScaleMatrix, false, scaleMat)
  gl.uniformMatrix4fv(program.uniforms.uModelRotMatrix, false, rotMat)
  gl.uniformMatrix4fv(program.uniforms.uModelMatrix, false, modelMat)
  gl.uniformMatrix4fv(program.uniforms.uViewMatrix, false, viewMat)
  gl.uniformMatrix4fv(program.uniforms.uProjectionMatrix, false, projMat)
  gl.uniformMatrix4fv(program.uniforms.uTransformMatrix, false, transMat)
  
  gl.uniform1i(program.uniforms.uTexture, bufferedTexture.index)
  
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferedMesh.vertices)
  gl.vertexAttribPointer(program.attributes.aPosition, 3, gl.FLOAT, false, 0, 0)

  gl.bindBuffer(gl.ARRAY_BUFFER, bufferedMesh.normals)
  gl.vertexAttribPointer(program.attributes.aNormal, 3, gl.FLOAT, false, 0, 0)

  gl.bindBuffer(gl.ARRAY_BUFFER, bufferedMesh.uvs)
  gl.vertexAttribPointer(program.attributes.aUV, 2, gl.FLOAT, false, 0, 0)
  
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferedMesh.indices)
  gl.drawElements(gl.TRIANGLES, bufferedMesh.indexCount, gl.UNSIGNED_SHORT, 0)
}

function makeRender () {
  gl.useProgram(program.program)
  gl.enable(gl.BLEND)
  gl.enable(gl.CULL_FACE)
  gl.enable(gl.DEPTH_TEST)
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
  gl.clearColor(1.0, 1.0, 1.0, 1.0)
  gl.colorMask(true, true, true, true)

  gl.enableVertexAttribArray(program.attributes.aPosition)
  gl.enableVertexAttribArray(program.attributes.aNormal)
  gl.enableVertexAttribArray(program.attributes.aUV)

  return function render () {
    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    for (var i = 0, len = renderables.length; i < len; i++) {
      renderModel(renderer, camera, renderables[i])  
    }

    requestAnimationFrame(render) 
  }
}

function makeUpdate () {
  var fullRotation = Math.PI / 2
  var xRot         = Math.PI / 90
  var yRot         = Math.PI / 180
  var zRot         = Math.PI / 270

  return function update () {
    for (var i = 0; i < renderables.length; i++) {
      renderables[i].physics.rotation[0] += xRot % fullRotation 
      renderables[i].physics.rotation[1] += yRot % fullRotation 
      renderables[i].physics.rotation[2] += zRot % fullRotation 
    }
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
  loadModelFromSchema(capsuleSchema, function (err, model) {
    cache.models[model.name] = model
    //TODO: should refactor to use transformValues and bufferModel
    cache.bufferedModels = bufferModels(gl, cache.models)
    renderables.push(new Renderable(cache.bufferedModels[model.name], 1, 1, 1))
    renderables.push(new Renderable(cache.bufferedModels[model.name], 0, 0, 0))

    if (err) return console.error(err)
    else            boot(cache)
  })
}

window.onload = init
