module.exports = Mesh

function Mesh (name, geometry, textures, program) {
  this.name     = name
  this.geometry = geometry
  this.textures = textures
  this.program  = program
}
