module.exports = NPOTLoadedTexture

function NPOTLoadedTexture (gl, webglew, textureUnit, texture) {
  var ANI_EXT  = webglew.EXT_texture_filter_anisotropic
  var sRGB_EXT = webglew.EXT_sRGB
  var format   = !!sRGB_EXT ? sRGB_EXT.SRGB_ALPHA_EXT : gl.RGBA

  this.glTexture   = gl.createTexture()
  this.textureUnit = textureUnit

  gl.activeTexture(gl.TEXTURE0 + textureUnit)
  gl.bindTexture(gl.TEXTURE_2D, this.glTexture)
  gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, texture.image)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  if (ANI_EXT) gl.texParameterf(gl.TEXTURE_2D, ANI_EXT.TEXTURE_MAX_ANISOTROPY_EXT, 4)
  gl.bindTexture(gl.TEXTURE_2D, null)
}
