var Entity                 = require("./Entity")
var PhysicsComponent       = require("./components/PhysicsComponent")
var BufferedModelComponent = require("./components/BufferedModelComponent")

module.exports.Renderable = Renderable

function Renderable (model, x, y, z) {
  Entity.call(this) 
  PhysicsComponent(x, y, z, this)
  BufferedModelComponent(model, this) 
}
