module.exports = LoadedTexture

function LoadedTexture (gl, textureUnit, data) {
  var format    = gl.RGBA
  var minFilter = gl.NEAREST_MIPMAP_NEAREST
  var magFilter = gl.NEAREST

  this.glTexture   = gl.createTexture()
  this.textureUnit = textureUnit

  gl.activeTexture(gl.TEXTURE0 + textureUnit)
  gl.bindTexture(gl.TEXTURE_2D, this.glTexture)
  gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, data) 
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter)
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.bindTexture(gl.TEXTURE_2D, null)
}
