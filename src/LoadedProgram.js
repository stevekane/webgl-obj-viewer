var Shader = require("./Shader")

module.exports = LoadedProgram

function LoadedProgram (gl, vs, fs, drawFn) {
  var glProgram     = gl.createProgram(vs, fs)
  var attributes    = {}
  var uniforms      = {}
  var numAttributes
  var numUniforms
  var aName
  var uName

  gl.attachShader(glProgram, vs)
  gl.attachShader(glProgram, fs)
  gl.linkProgram(glProgram)

  numAttributes = gl.getProgramParameter(glProgram, gl.ACTIVE_ATTRIBUTES)
  numUniforms   = gl.getProgramParameter(glProgram, gl.ACTIVE_UNIFORMS)

  for (var i = 0; i < numAttributes; ++i) {
    aName             = gl.getActiveAttrib(glProgram, i).name
    attributes[aName] = gl.getAttribLocation(glProgram, aName)
    gl.enableVertexAttribArray(attributes[aName])
  }

  for (var j = 0; j < numUniforms; ++j) {
    uName           = gl.getActiveUniform(glProgram, j).name
    uniforms[uName] = gl.getUniformLocation(glProgram, uName)
  }

  this.glProgram  = glProgram
  this.uniforms   = uniforms
  this.attributes = attributes
  this.drawFn     = drawFn
}

LoadedProgram.fromProgram = function (gl, program) {
  var vs     = new Shader(gl, gl.VERTEX_SHADER, program.vSrc)
  var fs     = new Shader(gl, gl.FRAGMENT_SHADER, program.fSrc)
  var drawFn = new Function("return " + program.drawSrc)()

  return new LoadedProgram(gl, vs, fs, drawFn)
}
