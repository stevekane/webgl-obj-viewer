module.exports = BufferedGeometry

function BufferedGeometry (gl, geometry) {
  var vertices = gl.createBuffer()
  var uvs      = gl.createBuffer()
  var normals  = gl.createBuffer()
  var indices  = gl.createBuffer()

  gl.bindBuffer(gl.ARRAY_BUFFER, vertices)
  gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW)

  gl.bindBuffer(gl.ARRAY_BUFFER, uvs)
  gl.bufferData(gl.ARRAY_BUFFER, geometry.uvs, gl.STATIC_DRAW)

  gl.bindBuffer(gl.ARRAY_BUFFER, normals)
  gl.bufferData(gl.ARRAY_BUFFER, geometry.normals, gl.STATIC_DRAW)

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW)

  this.indexCount = geometry.indices.length
  this.vertices   = vertices
  this.uvs        = uvs
  this.normals    = normals
  this.indices    = indices
}
