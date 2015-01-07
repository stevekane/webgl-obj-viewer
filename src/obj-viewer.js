var OBJ = require("webgl-obj-loader")

var requiredAssets = {
  meshes: {
    pumpkin: "/meshes/pumpkin_tall_10k.obj" 
  }
}

function loadAssets (assetHash, cb) {
  OBJ.downloadMeshes(assetHash.meshes, function (meshes) { 
    cb(null, {meshes: meshes}) 
  })
}

function init () {
  loadAssets(requiredAssets, function (err, assets) {
    console.log(assets) 
  })
}

window.onload = init
