module.exports = LoadedTexture

//sRGB allows for gamma correction to be handled by GPU but also prevents
//mipmapping.  Unsure how to procede here.
//according to the web, there exists an nvidia extension that makes exactly
//this possible.  However, on my dev machine I don't seem to have this extension
//so I am unsure if it's safe/reliable to include it...
function LoadedTexture (gl, webglew, textureUnit, texture) {
  var ANI_EXT   = webglew.EXT_texture_filter_anisotropic
  var sRGB_EXT  = webglew.EXT_sRGB
  var useMipMap = false
  var format    = useMipMap ? gl.RGBA : sRGB_EXT.SRGB_ALPHA_EXT
  var minFilter = useMipMap ? gl.NEAREST_MIPMAP_NEAREST : gl.NEAREST
  var magFilter = gl.NEAREST

  this.glTexture   = gl.createTexture()
  this.textureUnit = textureUnit

  gl.activeTexture(gl.TEXTURE0 + textureUnit)
  gl.bindTexture(gl.TEXTURE_2D, this.glTexture)
  gl.texImage2D(gl.TEXTURE_2D, 0, format, format, gl.UNSIGNED_BYTE, texture.image)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter)
  if (useMipMap) gl.generateMipmap(gl.TEXTURE_2D)
  if (ANI_EXT) gl.texParameterf(gl.TEXTURE_2D, ANI_EXT.TEXTURE_MAX_ANISOTROPY_EXT, 4)
  gl.bindTexture(gl.TEXTURE_2D, null)
}
