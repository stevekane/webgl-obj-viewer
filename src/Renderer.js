var mat4 = require("gl-mat4")

module.exports = Renderer

function Renderer (gl) {
  this.gl              = gl
  this.transformMatrix = mat4.create()
  this.boundBuffers    = {
    positions: null,
    normals:   null,  
    uvs:       null,
    indices:   null
  }
  this.boundTextures = {
    main: null,
    bump: null 
  }
}
