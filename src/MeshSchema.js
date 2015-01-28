module.exports = MeshSchema

function MeshSchema (name, textureSchemas, programSchema) {
  this.name           = name
  this.textureSchemas = textureSchemas
  this.programSchema  = programSchema
}
