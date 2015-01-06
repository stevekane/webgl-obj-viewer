var http   = require("http")
var static = require("node-static")

var fileServer = new static.Server("./public")
var httpServer = http.createServer(function (req, res) {
  req.addListener('end', function () {
    fileServer.serve(req, res) 
  }).resume()
})

httpServer.listen(4002)
