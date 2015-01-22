var mat4                = require("gl-mat4")
var vec3                = require("gl-vec3")
var Clock               = require("./Clock")
var Camera              = require("./Camera")
var Cache               = require("./Cache")
var glUtils             = require("./gl-utils")
var Loader              = require("./Loader")
var monkeySchema        = require("./monkeySchema.json")
var capsuleSchema       = require("./capsuleSchema.json")
var loadModelFromSchema = Loader.loadModelFromSchema
var bufferModels        = glUtils.bufferModels
var bufferMesh          = glUtils.bufferMesh
var canvas              = document.getElementById("canvas")
var gl                  = canvas.getContext("webgl")
var program             = glUtils.Program.fromDomNodes(gl, "vertex", "fragment")

var clock  = new Clock
var cache  = new Cache
var camera = new Camera(canvas, 0, 0, -1.5, 0, 0, 0)

function makeRender () {
  var mesh            = cache.models.capsule.meshes.main
  var bufferedModels  = bufferModels(gl, cache.models)
  var bufferedMesh    = bufferedModels.capsule.meshBuffers.main
  var bufferedTexture = bufferedModels.capsule.textureBuffers.main

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
    mat4.translate(modelTransMat, modelTransMat, modelTrans)
    mat4.scale(modelScaleMat, modelScaleMat, modelScale)
    mat4.rotateX(modelRotMat, modelRotMat, modelRot[0])
    mat4.rotateY(modelRotMat, modelRotMat, modelRot[1])
    mat4.rotateZ(modelRotMat, modelRotMat, modelRot[2])

    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.uniformMatrix4fv(program.uniforms.uModelTransMatrix, false, modelTransMat)
    gl.uniformMatrix4fv(program.uniforms.uModelScaleMatrix, false, modelScaleMat)
    gl.uniformMatrix4fv(program.uniforms.uModelRotMatrix, false, modelRotMat)
    gl.uniformMatrix4fv(program.uniforms.uViewMatrix, false, camera.viewMatrix)
    gl.uniformMatrix4fv(program.uniforms.uProjectionMatrix, false, camera.projectionMatrix)
    
    //Point at the texture in gl.TEXTURE0
    gl.uniform1i(program.uniforms.uTexture, 0)
    gl.uniform1i(program.uniforms.uBumpMap, 1)
    
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferedMesh.vertices)
    gl.vertexAttribPointer(program.attributes.aPosition, 3, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferedMesh.normals)
    gl.vertexAttribPointer(program.attributes.aNormal, 3, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferedMesh.uvs)
    gl.vertexAttribPointer(program.attributes.aUV, 2, gl.FLOAT, false, 0, 0)
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferedMesh.indices)
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
  loadModelFromSchema(capsuleSchema, function (err, model) {
    cache.models[model.name] = model

    if (err) return console.error(err)
    else            boot(cache)
  })
}

window.onload = init
