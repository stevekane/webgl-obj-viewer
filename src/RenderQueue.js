var vec3     = require("gl-vec3")
var Geometry = require("./Geometry")
var Texture  = require("./Texture")
var Program  = require("./Program")
var Mesh     = require("./Mesh")

module.exports = RenderQueue

function MeshJob (position, rotation, scale, mesh) {
  this.position = position
  this.rotation = rotation 
  this.scale    = scale
  this.mesh     = mesh
}

function RenderQueue (count) {
  var defaultPosition = vec3.fromValues(0,0,0)
  var defaultRotation = vec3.fromValues(0,0,0)
  var defaultScale    = vec3.fromValues(1,1,1)
  var defaultGeometry = new Geometry("default", [], [], [], [])
  var defaultProgram  = new Program("default", "", "", "")
  var defaultTextures = [new Texture("default", new Image)]
  var defaultMesh     = new Mesh(
    "default", 
    defaultGeometry, 
    defaultTextures, 
    defaultProgram 
  )
  var refList   = []
  var pointer   = 0

  for (var i = 0; i < count; i++) {
    refList.push(
      new MeshJob(defaultPosition, defaultRotation, defaultScale, defaultMesh)
    )
  }

  this.refList   = refList
  Object.defineProperty(this, "size", {
    get: function () { return count } 
  })
  Object.defineProperty(this, "pointer", {
    set: function (val) { 
      if      (val < 0)          pointer = 0
      else if (val >= this.size) pointer = this.size - 1
      else                       pointer = val
    },
    get: function () { return pointer }
  })
}

RenderQueue.prototype.pop = function () {
  if (this.pointer <= 0) return null
  else                   return this.refList[--this.pointer]
}

RenderQueue.prototype.push = function (position, rotation, scale, mesh) {
  var meshJob = this.refList[this.pointer++]

  meshJob.position = position
  meshJob.rotation = rotation
  meshJob.scale    = scale
  meshJob.mesh     = mesh
}
