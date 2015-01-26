var Entity                 = require("./Entity")
var PhysicsComponent       = require("./components/PhysicsComponent")
var BufferedModelComponent = require("./components/BufferedModelComponent")

module.exports.Renderable = Renderable

function Renderable (model) {
  Entity.call(this) 
  PhysicsComponent(0, 0, 0, this)
  BufferedModelComponent(model, this) 
}
