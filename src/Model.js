module.exports = Model

function Model (name, meshes, textures) {
  this.name     = name
  this.meshes   = meshes
  this.textures = textures
  Object.freeze(this)
}
