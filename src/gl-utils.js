var fns             = require("./functions")
var transformValues = fns.transformValues

//TODO: this probably needs some bookkeeping to keep track of what
//texture index (0-31) that this texture has been uploaded to.  
function bufferTexture (gl, tracker, image) {
  var texture = gl.createTexture()
  var index   = tracker.index

  gl.activeTexture(tracker.channels[tracker.index++])
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return {
    index:   index,
    texture: texture 
  }
}
