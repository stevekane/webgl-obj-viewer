module.exports.transformValues = transformValues

function transformValues (fn, obj) {
  var out  = {}
  var keys = Object.keys(obj)

  for (var i = 0; i < keys.length; ++i) {
    out[keys[i]] = fn(obj[keys[i]])
  }
  return out
}
