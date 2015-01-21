var mat4                = require("gl-mat4")
var vec3                = require("gl-vec3")
var Clock               = require("./Clock")
var Camera              = require("./Camera")
var Cache               = require("./Cache")
var glUtils             = require("./gl-utils")
var Loader              = require("./Loader")
var fns                 = require("./functions")
var monkeySchema        = require("./monkeySchema.json")
var loadModelFromSchema = Loader.loadModelFromSchema
var transformValues     = fns.transformValues
var canvas              = document.getElementById("canvas")
var gl                  = canvas.getContext("webgl")
var program             = glUtils.Program.fromDomNodes(gl, "vertex", "fragment")

var clock  = new Clock
var cache  = new Cache
var camera = new Camera(canvas, 0, 0, -1.4, 0, 0, 0)

/* We have our .obj files and textures stored in CPU memory.
 * We would like to upload the textures and model data to the GPU
 * so that we do not need to pay the cost of uploading this static
 * data to the GPU every time we want to render an entity that uses
 * these models.
 *
 * This would also allow us to clear our CPU cache of potentially
 * large amounts of data as they are already stored in the GPU buffers.
 */
function bufferModels (gl, models) {
  var modelNames     = Object.keys(models)
  var modelCount     = modelNames.length
  var bufferedModels = {} 
  var bufMesh        = function (mesh) { return bufferMesh(gl, mesh) }
  var name

  for (var i = 0; i < modelCount; ++i) {
    name                 = modelNames[i]
    model                = models[name]
    bufferedModels[name] = {
      name:        name,
      meshBuffers: transformValues(bufMesh, model.meshes),
      //textureBuffers: transformValues(bufferTexture, model.textures)
    }
  }
  return bufferedModels
}

function bufferMesh (gl, mesh) {
  var vertices = gl.createBuffer()
  var uvs      = gl.createBuffer()
  var normals  = gl.createBuffer()
  var indices  = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, vertices)
  gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW)

  gl.bindBuffer(gl.ARRAY_BUFFER, uvs)
  gl.bufferData(gl.ARRAY_BUFFER, mesh.uvs, gl.STATIC_DRAW)

  gl.bindBuffer(gl.ARRAY_BUFFER, normals)
  gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW)

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW)

  return {
    vertices: vertices,
    uvs:      uvs,
    normals:  normals,
    indices:  indices
  }
}

function makeRender () {
  var mesh           = cache.models.monkey.meshes.head
  var bufferedModels = bufferModels(gl, cache.models)
  var bufferedMesh   = bufferedModels.monkey.meshBuffers.head

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
  //gl.enableVertexAttribArray(program.attributes.aUVs)

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
    
    //bind locations to pre-loaded buffers of data for this mesh
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferedMesh.vertices)
    gl.vertexAttribPointer(program.attributes.aPosition, 3, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, bufferedMesh.normals)
    gl.vertexAttribPointer(program.attributes.aNormal, 3, gl.FLOAT, false, 0, 0)

    //TODO: not currently used in shaders
    //gl.bindBuffer(gl.ARRAY_BUFFER, bufferedMesh.uvs)
    //gl.vertexAttribPointer(program.attributes.aUVs, 3, gl.FLOAT, false, 0, 0)
    
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
  loadModelFromSchema(monkeySchema, function (err, model) {
    cache.models[model.name] = model

    if (err) return console.error(err)
    else            boot(cache)
  })
}

window.onload = init
