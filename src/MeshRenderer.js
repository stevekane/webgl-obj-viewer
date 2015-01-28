var OBJ = require("webgl-obj-loader")

module.exports = MeshRenderer

//Name of a mesh is assumed to be unique within a program
function Mesh (name, program, textures, objStr) {
  var mesh = new OBJ.Mesh(objStr) 

  this.name     = name
  this.vertices = new Float32Array(normalize(center(mesh.vertices)))
  this.indices  = new Uint16Array(mesh.indices)
  this.normals  = new Float32Array(mesh.vertexNormals)
  this.uvs      = new Float32Array(mesh.textures)
  this.program  = program
  this.textures = textures
}

//container for GPU buffers for a given mesh
function BufferedMesh (name, indexCount, vertices, uvs, normals, indices) {
  this.name       = name 
  this.indexCount = indexCount
  this.vertices   = vertices
  this.uvs        = uvs
  this.normals    = normals
  this.indices    = indices
}

function MeshRenderer (gl) {
  this.gl                = gl 
  this.bufferedMeshes    = {}
  this.boundBufferedMesh = null
}

MeshRenderer.prototype.bufferMesh = function (mesh) {
  var gl             = this.gl
  var bufferedMeshes = this.bufferedMeshes
  var vertices       = gl.createBuffer()
  var uvs            = gl.createBuffer()
  var normals        = gl.createBuffer()
  var indices        = gl.createBuffer()
  var bufferedMesh   = new BufferedMesh(
    mesh.name,
    mesh.indices.length,
    vertices,
    uvs,
    normals,
    indices 
  )

  bufferedMeshes[bufferedMesh.name] = bufferedMesh

  gl.bindBuffer(gl.ARRAY_BUFFER, vertices)
  gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW)

  gl.bindBuffer(gl.ARRAY_BUFFER, uvs)
  gl.bufferData(gl.ARRAY_BUFFER, mesh.uvs, gl.STATIC_DRAW)

  gl.bindBuffer(gl.ARRAY_BUFFER, normals)
  gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW)

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW)
  
  return bufferedMesh
}

function bindBufferedMesh (program, bufferedMesh) {
  var program = this.activeProgram

  gl.bindBuffer(gl.ARRAY_BUFFER, bufferedMesh.vertices)
  gl.vertexAttribPointer(program.attributes.aPosition, 3, gl.FLOAT, false, 0, 0)

  gl.bindBuffer(gl.ARRAY_BUFFER, bufferedMesh.normals)
  gl.vertexAttribPointer(program.attributes.aNormal, 3, gl.FLOAT, false, 0, 0)

  gl.bindBuffer(gl.ARRAY_BUFFER, bufferedMesh.uvs)
  gl.vertexAttribPointer(program.attributes.aUV, 2, gl.FLOAT, false, 0, 0)

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferedMesh.indices)
}

//possible internal api for renderer?
function drawMeshGroup (renderer, mesh, _) {

}

function drawMesh (renderer, mesh, modelMatrix, viewMatrix, projMatrix) {
  var gl       = renderer.gl
  var program  = renderer.activeProgram
  var bMesh    = renderer.bufferedMeshes[meshName]
  var bTexture = renderer.bufferedTextures[

  if (!program) throw new Error("No active program is bound")
  if (!bMesh) throw new Error("No buffered mesh found for name " + mesh.name)

  //var bTexture =  ?????
  //var program  =  ?????

    
}
