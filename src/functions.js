module.exports.transformValues = transformValues
module.exports.pluck           = pluck
module.exports.defined         = defined

function transformValues (fn, obj) {
  var out  = {}
  var keys = Object.keys(obj)

  for (var i = 0; i < keys.length; ++i) {
    out[keys[i]] = fn(obj[keys[i]])
  }
  return out
}

function pluck (propName, array) {
  var results = []

  for (var i = 0, len=array.length; i < len; i++) {
    results.push(array[i][propName])
  }
  return results
}

function defined (value) {
  return value !== undefined && value !== null
}
