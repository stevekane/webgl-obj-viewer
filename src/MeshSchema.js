module.exports = MeshSchema

function MeshSchema (name, path, geometrySchema, textureSchemas, programSchema) {
  this.name           = name
  this.path           = path
  this.geometrySchema = geometrySchema
  this.textureSchemas = textureSchemas
  this.programSchema  = programSchema
}
