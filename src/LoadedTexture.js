module.exports = LoadedTexture

function LoadedTexture (gl, webglew, textureUnit, texture) {
  var ANI_EXT = webglew.EXT_texture_filter_anisotropic
  
  this.glTexture   = gl.createTexture()
  this.textureUnit = textureUnit

  gl.activeTexture(gl.TEXTURE0 + textureUnit)
  gl.bindTexture(gl.TEXTURE_2D, this.glTexture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
  gl.generateMipmap(gl.TEXTURE_2D)
  if (ANI_EXT) gl.texParameterf(gl.TEXTURE_2D, ANI_EXT.TEXTURE_MAX_ANISOTROPY_EXT, 4)
  gl.bindTexture(gl.TEXTURE_2D, null)
}
