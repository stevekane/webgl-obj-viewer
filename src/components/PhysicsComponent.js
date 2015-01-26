var mat4 = require("gl-mat4")
var vec3 = require("gl-vec3")

module.exports = PhysicsComponent

function PhysicsComponent (x,y,z,entity) {
  var rotMat   = mat4.create()
  var scaleMat = mat4.create()
  var transMat = mat4.create()

  entity.physics              = {}
  entity.physics.position     = vec3.fromValues(x,y,z)
  entity.physics.velocity     = vec3.fromValues(0,0,0)
  entity.physics.acceleration = vec3.fromValues(0,0,0)
  entity.physics.rotation     = vec3.fromValues(0,0,0)
  
  Object.defineProperty(entity.physics, "rotMat", {
    get: function () {
      mat4.identity(rotMat)
      mat4.rotateX(rotMat, rotMat, entity.physics.rotation[0])
      mat4.rotateY(rotMat, rotMat, entity.physics.rotation[1])
      mat4.rotateZ(rotMat, rotMat, entity.physics.rotation[2])
      return rotMat
    }   
  })

  Object.defineProperty(entity.physics, "scaleMat", {
    get: function () { return scaleMat }
  })

  Object.defineProperty(entity.physics, "transMat", {
    get: function () {
      mat4.identity(transMat)  
      return mat4.translate(transMat, transMat, entity.physics.position)
    }
  })
  return entity
}
