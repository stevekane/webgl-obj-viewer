module.exports = Entity

var idCounter = 0

function Entity () {
  this.id = idCounter++
}
