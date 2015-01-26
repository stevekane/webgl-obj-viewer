module.exports = Renderer

function Renderer (gl, models) {
  var model
  var name

  this.meshBuffers    = {}
  this.textureBuffers = {}

  for (var i = 0; i < models.length; ++i) {
    model = models[i]
    name  = model.name

    this.meshBuffers[name] = bufferMesh(gl, model.
  }
}
