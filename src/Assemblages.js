var Entity           = require("./Entity")
var PhysicsComponent = require("./components/PhysicsComponent")
var ModelComponent   = require("./components/ModelComponent")

module.exports.Renderable = Renderable

function Renderable (model, x, y, z) {
  Entity.call(this) 
  PhysicsComponent(x, y, z, this)
  ModelComponent(model, this) 
}
