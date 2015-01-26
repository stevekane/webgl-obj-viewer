var mat4                = require("gl-mat4")
var vec3                = require("gl-vec3")
var Clock               = require("./Clock")
var Camera              = require("./Camera")
var Cache               = require("./Cache")
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
var renderables = []

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
    var r               = renderables[0]
    var phys            = r.physics
    var bufferedTexture = r.bufferedModel.textureBuffers.main
    var bufferedMesh    = r.bufferedModel.meshBuffers.main

    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.uniformMatrix4fv(program.uniforms.uModelTransMatrix, false, phys.transMat)
    gl.uniformMatrix4fv(program.uniforms.uModelScaleMatrix, false, phys.scaleMat)
    gl.uniformMatrix4fv(program.uniforms.uModelRotMatrix, false, phys.rotMat)
    gl.uniformMatrix4fv(program.uniforms.uModelMatrix, false, phys.modelMat)
    gl.uniformMatrix4fv(program.uniforms.uViewMatrix, false, camera.viewMatrix)
    gl.uniformMatrix4fv(program.uniforms.uProjectionMatrix, false, camera.projectionMatrix)
    
    gl.uniform1i(program.uniforms.uTexture, bufferedTexture.index)
    
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferedMesh.vertices)
    gl.vertexAttribPointer(program.attributes.aPosition, 3, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferedMesh.normals)
    gl.vertexAttribPointer(program.attributes.aNormal, 3, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferedMesh.uvs)
    gl.vertexAttribPointer(program.attributes.aUV, 2, gl.FLOAT, false, 0, 0)
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferedMesh.indices)
    gl.drawElements(gl.TRIANGLES, bufferedMesh.indexCount, gl.UNSIGNED_SHORT, 0)

    requestAnimationFrame(render) 
  }
}

function makeUpdate () {
  var r    = renderables[0]
  var phys = r.physics

  return function update () {
    phys.rotation[1] += (Math.PI / 180)
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

    if (err) return console.error(err)
    else            boot(cache)
  })
}

window.onload = init
