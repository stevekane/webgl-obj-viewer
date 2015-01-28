module.exports.transformValues = transformValues
module.exports.pluck           = pluck

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

  for (var i = 0, i < array.length; i++) {
    results.push(array[i][propName])
  }
  return results
}
