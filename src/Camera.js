module.exports = Camera

function Camera (x, y, z, atX, atY, atZ) {
  this.position = new Float32Array(3)
  this.target   = new Float32Array(3)
  this.up       = new Float32Array(3)

  this.position[0] = x
  this.position[1] = y
  this.position[2] = z

  this.target[0] = atX
  this.target[1] = atY
  this.target[2] = atZ

  this.up[0] = 0
  this.up[1] = 1
  this.up[2] = 0
}
