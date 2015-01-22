var fns             = require("./functions")
var transformValues = fns.transformValues

module.exports.Shader       = Shader
module.exports.Program      = Program
module.exports.bufferModels = bufferModels
module.exports.bufferMesh   = bufferMesh

function Shader (gl, type, src) {
  var shader  = gl.createShader(type)
  var isValid = false
  
  gl.shaderSource(shader, src)
  gl.compileShader(shader)

  isValid = gl.getShaderParameter(shader, gl.COMPILE_STATUS)

  if (!isValid) throw new Error("Not valid shader: \n" + gl.getShaderInfoLog(shader))
  return        shader
}

function Program (gl, vs, fs) {
  var program       = gl.createProgram(vs, fs)
  var attributes    = {}
  var uniforms      = {}
  var numAttributes
  var numUniforms
  var aName
  var uName

  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)

  numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)
  numUniforms   = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)

  for (var i = 0; i < numAttributes; ++i) {
    aName             = gl.getActiveAttrib(program, i).name
    attributes[aName] = gl.getAttribLocation(program, aName)
  }

  for (var j = 0; j < numUniforms; ++j) {
    uName           = gl.getActiveUniform(program, j).name
    uniforms[uName] = gl.getUniformLocation(program, uName)
  }

  this.program    = program
  this.uniforms   = uniforms
  this.attributes = attributes
}

Program.fromDomNodes = function (gl, vSrcId, fSrcId) {
  var vSrc = document.getElementById(vSrcId).text
  var fSrc = document.getElementById(fSrcId).text
  var vs   = new Shader(gl, gl.VERTEX_SHADER, vSrc)
  var fs   = new Shader(gl, gl.FRAGMENT_SHADER, fSrc)
  
  return new Program(gl, vs, fs)
}

/* We have our .obj files and textures stored in CPU memory.
 * We would like to upload the textures and model data to the GPU
 * so that we do not need to pay the cost of uploading this static
 * data to the GPU every time we want to render an entity that uses
 * these models.
 *
 * This would also allow us to clear our CPU cache of potentially
 * large amounts of data as they are already stored in the GPU buffers.
 *
 * N.B. For now, we pass a counter into the bufferTexture function
 * which ensures that each texture that is buffered has a unique channel
 * This is limited to 32 textures and is not a very robust system.   Probably
 * need to revise and enhance it soon.
 */
function bufferModels (gl, models) {
  var tracker        = {
    channels: [
      gl.TEXTURE0,
      gl.TEXTURE1,
      gl.TEXTURE2,
      gl.TEXTURE3
    ],
    index: 0
  }
  var modelNames     = Object.keys(models)
  var modelCount     = modelNames.length
  var bufferedModels = {} 
  var bufMesh        = function (mesh) { return bufferMesh(gl, mesh) }
  var bufTex         = function (texture) { return bufferTexture(gl, tracker, texture) }
  var name

  for (var i = 0; i < modelCount; ++i) {
    name                 = modelNames[i]
    model                = models[name]
    bufferedModels[name] = {
      name:           name,
      meshBuffers:    transformValues(bufMesh, model.meshes),
      textureBuffers: transformValues(bufTex, model.textures)
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

//TODO: this probably needs some bookkeeping to keep track of what
//texture index (0-31) that this texture has been uploaded to.  
function bufferTexture (gl, tracker, image) {
  var texture = gl.createTexture()

  gl.activeTexture(tracker.channels[tracker.index++])
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return texture
}
