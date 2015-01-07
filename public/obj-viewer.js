(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (undefined) {
  'use strict';

  var OBJ = {};

  if (typeof module !== 'undefined') {
    module.exports = OBJ;
  } else {
    window.OBJ = OBJ;
  }

  /**
   * The main Mesh class. The constructor will parse through the OBJ file data
   * and collect the vertex, vertex normal, texture, and face information. This
   * information can then be used later on when creating your VBOs. See
   * OBJ.initMeshBuffers for an example of how to use the newly created Mesh
   *
   * @class Mesh
   * @constructor
   *
   * @param {String} objectData a string representation of an OBJ file with newlines preserved.
   */
  OBJ.Mesh = function (objectData) {
    /*
     The OBJ file format does a sort of compression when saving a model in a
     program like Blender. There are at least 3 sections (4 including textures)
     within the file. Each line in a section begins with the same string:
       * 'v': indicates vertex section
       * 'vn': indicates vertex normal section
       * 'f': indicates the faces section
       * 'vt': indicates vertex texture section (if textures were used on the model)
     Each of the above sections (except for the faces section) is a list/set of
     unique vertices.

     Each line of the faces section contains a list of
     (vertex, [texture], normal) groups
     Some examples:
         // the texture index is optional, both formats are possible for models
         // without a texture applied
         f 1/25 18/46 12/31
         f 1//25 18//46 12//31

         // A 3 vertex face with texture indices
         f 16/92/11 14/101/22 1/69/1

         // A 4 vertex face
         f 16/92/11 40/109/40 38/114/38 14/101/22

     The first two lines are examples of a 3 vertex face without a texture applied.
     The second is an example of a 3 vertex face with a texture applied.
     The third is an example of a 4 vertex face. Note: a face can contain N
     number of vertices.

     Each number that appears in one of the groups is a 1-based index
     corresponding to an item from the other sections (meaning that indexing
     starts at one and *not* zero).

     For example:
         `f 16/92/11` is saying to
           - take the 16th element from the [v] vertex array
           - take the 92nd element from the [vt] texture array
           - take the 11th element from the [vn] normal array
         and together they make a unique vertex.
     Using all 3+ unique Vertices from the face line will produce a polygon.

     Now, you could just go through the OBJ file and create a new vertex for
     each face line and WebGL will draw what appears to be the same model.
     However, vertices will be overlapped and duplicated all over the place.

     Consider a cube in 3D space centered about the origin and each side is
     2 units long. The front face (with the positive Z-axis pointing towards
     you) would have a Top Right vertex (looking orthogonal to its normal)
     mapped at (1,1,1) The right face would have a Top Left vertex (looking
     orthogonal to its normal) at (1,1,1) and the top face would have a Bottom
     Right vertex (looking orthogonal to its normal) at (1,1,1). Each face
     has a vertex at the same coordinates, however, three distinct vertices
     will be drawn at the same spot.

     To solve the issue of duplicate Vertices (the `(vertex, [texture], normal)`
     groups), while iterating through the face lines, when a group is encountered
     the whole group string ('16/92/11') is checked to see if it exists in the
     packed.hashindices object, and if it doesn't, the indices it specifies
     are used to look up each attribute in the corresponding attribute arrays
     already created. The values are then copied to the corresponding unpacked
     array (flattened to play nice with WebGL's ELEMENT_ARRAY_BUFFER indexing),
     the group string is added to the hashindices set and the current unpacked
     index is used as this hashindices value so that the group of elements can
     be reused. The unpacked index is incremented. If the group string already
     exists in the hashindices object, its corresponding value is the index of
     that group and is appended to the unpacked indices array.
     */
    var verts = [], vertNormals = [], textures = [], unpacked = {};
    // unpacking stuff
    unpacked.verts = [];
    unpacked.norms = [];
    unpacked.textures = [];
    unpacked.hashindices = {};
    unpacked.indices = [];
    unpacked.index = 0;
    // array of lines separated by the newline
    var lines = objectData.split('\n');
    
    var VERTEX_RE = /^v\s/;
    var NORMAL_RE = /^vn\s/;
    var TEXTURE_RE = /^vt\s/;
    var FACE_RE = /^f\s/;
    var WHITESPACE_RE = /\s+/;
    
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      var elements = line.split(WHITESPACE_RE);
      elements.shift();
      
      if (VERTEX_RE.test(line)) {
        // if this is a vertex
        verts.push.apply(verts, elements);
      } else if (NORMAL_RE.test(line)) {
        // if this is a vertex normal
        vertNormals.push.apply(vertNormals, elements);
      } else if (TEXTURE_RE.test(line)) {
        // if this is a texture
        textures.push.apply(textures, elements);
      } else if (FACE_RE.test(line)) {
        // if this is a face
        /*
        split this face into an array of vertex groups
        for example:
           f 16/92/11 14/101/22 1/69/1
        becomes:
          ['16/92/11', '14/101/22', '1/69/1'];
        */
        var quad = false;
        for (var j = 0, eleLen = elements.length; j < eleLen; j++){
            // Triangulating quads
            // quad: 'f v0/t0/vn0 v1/t1/vn1 v2/t2/vn2 v3/t3/vn3/'
            // corresponding triangles:
            //      'f v0/t0/vn0 v1/t1/vn1 v2/t2/vn2'
            //      'f v2/t2/vn2 v3/t3/vn3 v0/t0/vn0'
            if(j === 3 && !quad) {
                // add v2/t2/vn2 in again before continuing to 3
                j = 2;
                quad = true;
            }
            if(elements[j] in unpacked.hashindices){
                unpacked.indices.push(unpacked.hashindices[elements[j]]);
            }
            else{
                /*
                Each element of the face line array is a vertex which has its
                attributes delimited by a forward slash. This will separate
                each attribute into another array:
                    '19/92/11'
                becomes:
                    vertex = ['19', '92', '11'];
                where
                    vertex[0] is the vertex index
                    vertex[1] is the texture index
                    vertex[2] is the normal index
                 Think of faces having Vertices which are comprised of the
                 attributes location (v), texture (vt), and normal (vn).
                 */
                var vertex = elements[ j ].split( '/' );
                /*
                 The verts, textures, and vertNormals arrays each contain a
                 flattend array of coordinates.

                 Because it gets confusing by referring to vertex and then
                 vertex (both are different in my descriptions) I will explain
                 what's going on using the vertexNormals array:

                 vertex[2] will contain the one-based index of the vertexNormals
                 section (vn). One is subtracted from this index number to play
                 nice with javascript's zero-based array indexing.

                 Because vertexNormal is a flattened array of x, y, z values,
                 simple pointer arithmetic is used to skip to the start of the
                 vertexNormal, then the offset is added to get the correct
                 component: +0 is x, +1 is y, +2 is z.

                 This same process is repeated for verts and textures.
                 */
                // vertex position
                unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 0]);
                unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 1]);
                unpacked.verts.push(+verts[(vertex[0] - 1) * 3 + 2]);
                // vertex textures
                if (textures.length) {
                  unpacked.textures.push(+textures[(vertex[1] - 1) * 2 + 0]);
                  unpacked.textures.push(+textures[(vertex[1] - 1) * 2 + 1]);
                }
                // vertex normals
                unpacked.norms.push(+vertNormals[(vertex[2] - 1) * 3 + 0]);
                unpacked.norms.push(+vertNormals[(vertex[2] - 1) * 3 + 1]);
                unpacked.norms.push(+vertNormals[(vertex[2] - 1) * 3 + 2]);
                // add the newly created vertex to the list of indices
                unpacked.hashindices[elements[j]] = unpacked.index;
                unpacked.indices.push(unpacked.index);
                // increment the counter
                unpacked.index += 1;
            }
            if(j === 3 && quad) {
                // add v0/t0/vn0 onto the second triangle
                unpacked.indices.push( unpacked.hashindices[elements[0]]);
            }
        }
      }
    }
    this.vertices = unpacked.verts;
    this.vertexNormals = unpacked.norms;
    this.textures = unpacked.textures;
    this.indices = unpacked.indices;
  }

  var Ajax = function(){
    // this is just a helper class to ease ajax calls
    var _this = this;
    this.xmlhttp = new XMLHttpRequest();

    this.get = function(url, callback){
      _this.xmlhttp.onreadystatechange = function(){
        if(_this.xmlhttp.readyState === 4){
          callback(_this.xmlhttp.responseText, _this.xmlhttp.status);
        }
      };
      _this.xmlhttp.open('GET', url, true);
      _this.xmlhttp.send();
    }
  };

  /**
   * Takes in an object of `mesh_name`, `'/url/to/OBJ/file'` pairs and a callback
   * function. Each OBJ file will be ajaxed in and automatically converted to
   * an OBJ.Mesh. When all files have successfully downloaded the callback
   * function provided will be called and passed in an object containing
   * the newly created meshes.
   *
   * **Note:** In order to use this function as a way to download meshes, a
   * webserver of some sort must be used.
   *
   * @param {Object} nameAndURLs an object where the key is the name of the mesh and the value is the url to that mesh's OBJ file
   *
   * @param {Function} completionCallback should contain a function that will take one parameter: an object array where the keys will be the unique object name and the value will be a Mesh object
   *
   * @param {Object} meshes In case other meshes are loaded separately or if a previously declared variable is desired to be used, pass in a (possibly empty) json object of the pattern: { '<mesh_name>': OBJ.Mesh }
   *
   */
  OBJ.downloadMeshes = function (nameAndURLs, completionCallback, meshes){
    // the total number of meshes. this is used to implement "blocking"
    var semaphore = Object.keys(nameAndURLs).length;
    // if error is true, an alert will given
    var error = false;
    // this is used to check if all meshes have been downloaded
    // if meshes is supplied, then it will be populated, otherwise
    // a new object is created. this will be passed into the completionCallback
    if(meshes === undefined) meshes = {};
    // loop over the mesh_name,url key,value pairs
    for(var mesh_name in nameAndURLs){
      if(nameAndURLs.hasOwnProperty(mesh_name)){
        new Ajax().get(nameAndURLs[mesh_name], (function(name) {
          return function (data, status) {
            if (status === 200) {
              meshes[name] = new OBJ.Mesh(data);
            }
            else {
              error = true;
              console.error('An error has occurred and the mesh "' +
                name + '" could not be downloaded.');
            }
            // the request has finished, decrement the counter
            semaphore--;
            if (semaphore === 0) {
              if (error) {
                // if an error has occurred, the user is notified here and the
                // callback is not called
                console.error('An error has occurred and one or meshes has not been ' +
                  'downloaded. The execution of the script has terminated.');
                throw '';
              }
              // there haven't been any errors in retrieving the meshes
              // call the callback
              completionCallback(meshes);
            }
          }
        })(mesh_name));
      }
    }
  };

  var _buildBuffer = function( gl, type, data, itemSize ){
    var buffer = gl.createBuffer();
    var arrayView = type === gl.ARRAY_BUFFER ? Float32Array : Uint16Array;
    gl.bindBuffer(type, buffer);
    gl.bufferData(type, new arrayView(data), gl.STATIC_DRAW);
    buffer.itemSize = itemSize;
    buffer.numItems = data.length / itemSize;
    return buffer;
  }

  /**
   * Takes in the WebGL context and a Mesh, then creates and appends the buffers
   * to the mesh object as attributes.
   *
   * @param {WebGLRenderingContext} gl the `canvas.getContext('webgl')` context instance
   * @param {Mesh} mesh a single `OBJ.Mesh` instance
   *
   * The newly created mesh attributes are:
   *
   * Attrbute | Description
   * :--- | ---
   * **normalBuffer**       |contains the model&#39;s Vertex Normals
   * normalBuffer.itemSize  |set to 3 items
   * normalBuffer.numItems  |the total number of vertex normals
   * |
   * **textureBuffer**      |contains the model&#39;s Texture Coordinates
   * textureBuffer.itemSize |set to 2 items
   * textureBuffer.numItems |the number of texture coordinates
   * |
   * **vertexBuffer**       |contains the model&#39;s Vertex Position Coordinates (does not include w)
   * vertexBuffer.itemSize  |set to 3 items
   * vertexBuffer.numItems  |the total number of vertices
   * |
   * **indexBuffer**        |contains the indices of the faces
   * indexBuffer.itemSize   |is set to 1
   * indexBuffer.numItems   |the total number of indices
   *
   * A simple example (a lot of steps are missing, so don't copy and paste):
   *
   *     var gl   = canvas.getContext('webgl'),
   *         mesh = OBJ.Mesh(obj_file_data);
   *     // compile the shaders and create a shader program
   *     var shaderProgram = gl.createProgram();
   *     // compilation stuff here
   *     ...
   *     // make sure you have vertex, vertex normal, and texture coordinate
   *     // attributes located in your shaders and attach them to the shader program
   *     shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
   *     gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);
   *
   *     shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
   *     gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);
   *
   *     shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
   *     gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
   *
   *     // create and initialize the vertex, vertex normal, and texture coordinate buffers
   *     // and save on to the mesh object
   *     OBJ.initMeshBuffers(gl, mesh);
   *
   *     // now to render the mesh
   *     gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vertexBuffer);
   *     gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);
   *
   *     gl.bindBuffer(gl.ARRAY_BUFFER, mesh.textureBuffer);
   *     gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
   *
   *     gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normalBuffer);
   *     gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);
   *
   *     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.mesh.indexBuffer);
   *     gl.drawElements(gl.TRIANGLES, model.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
   */
  OBJ.initMeshBuffers = function( gl, mesh ){
    mesh.normalBuffer = _buildBuffer(gl, gl.ARRAY_BUFFER, mesh.vertexNormals, 3);
    mesh.textureBuffer = _buildBuffer(gl, gl.ARRAY_BUFFER, mesh.textures, 2);
    mesh.vertexBuffer = _buildBuffer(gl, gl.ARRAY_BUFFER, mesh.vertices, 3);
    mesh.indexBuffer = _buildBuffer(gl, gl.ELEMENT_ARRAY_BUFFER, mesh.indices, 1);
  }

  OBJ.deleteMeshBuffers = function( gl, mesh ){
    gl.deleteBuffer(mesh.normalBuffer);
    gl.deleteBuffer(mesh.textureBuffer);
    gl.deleteBuffer(mesh.vertexBuffer);
    gl.deleteBuffer(mesh.indexBuffer);
  }
})();


},{}],2:[function(require,module,exports){
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

},{"webgl-obj-loader":1}]},{},[2])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvd2ViZ2wtb2JqLWxvYWRlci93ZWJnbC1vYmotbG9hZGVyLmpzIiwic3JjL29iai12aWV3ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIoZnVuY3Rpb24gKHVuZGVmaW5lZCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgdmFyIE9CSiA9IHt9O1xuXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJykge1xuICAgIG1vZHVsZS5leHBvcnRzID0gT0JKO1xuICB9IGVsc2Uge1xuICAgIHdpbmRvdy5PQkogPSBPQko7XG4gIH1cblxuICAvKipcbiAgICogVGhlIG1haW4gTWVzaCBjbGFzcy4gVGhlIGNvbnN0cnVjdG9yIHdpbGwgcGFyc2UgdGhyb3VnaCB0aGUgT0JKIGZpbGUgZGF0YVxuICAgKiBhbmQgY29sbGVjdCB0aGUgdmVydGV4LCB2ZXJ0ZXggbm9ybWFsLCB0ZXh0dXJlLCBhbmQgZmFjZSBpbmZvcm1hdGlvbi4gVGhpc1xuICAgKiBpbmZvcm1hdGlvbiBjYW4gdGhlbiBiZSB1c2VkIGxhdGVyIG9uIHdoZW4gY3JlYXRpbmcgeW91ciBWQk9zLiBTZWVcbiAgICogT0JKLmluaXRNZXNoQnVmZmVycyBmb3IgYW4gZXhhbXBsZSBvZiBob3cgdG8gdXNlIHRoZSBuZXdseSBjcmVhdGVkIE1lc2hcbiAgICpcbiAgICogQGNsYXNzIE1lc2hcbiAgICogQGNvbnN0cnVjdG9yXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBvYmplY3REYXRhIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGFuIE9CSiBmaWxlIHdpdGggbmV3bGluZXMgcHJlc2VydmVkLlxuICAgKi9cbiAgT0JKLk1lc2ggPSBmdW5jdGlvbiAob2JqZWN0RGF0YSkge1xuICAgIC8qXG4gICAgIFRoZSBPQkogZmlsZSBmb3JtYXQgZG9lcyBhIHNvcnQgb2YgY29tcHJlc3Npb24gd2hlbiBzYXZpbmcgYSBtb2RlbCBpbiBhXG4gICAgIHByb2dyYW0gbGlrZSBCbGVuZGVyLiBUaGVyZSBhcmUgYXQgbGVhc3QgMyBzZWN0aW9ucyAoNCBpbmNsdWRpbmcgdGV4dHVyZXMpXG4gICAgIHdpdGhpbiB0aGUgZmlsZS4gRWFjaCBsaW5lIGluIGEgc2VjdGlvbiBiZWdpbnMgd2l0aCB0aGUgc2FtZSBzdHJpbmc6XG4gICAgICAgKiAndic6IGluZGljYXRlcyB2ZXJ0ZXggc2VjdGlvblxuICAgICAgICogJ3ZuJzogaW5kaWNhdGVzIHZlcnRleCBub3JtYWwgc2VjdGlvblxuICAgICAgICogJ2YnOiBpbmRpY2F0ZXMgdGhlIGZhY2VzIHNlY3Rpb25cbiAgICAgICAqICd2dCc6IGluZGljYXRlcyB2ZXJ0ZXggdGV4dHVyZSBzZWN0aW9uIChpZiB0ZXh0dXJlcyB3ZXJlIHVzZWQgb24gdGhlIG1vZGVsKVxuICAgICBFYWNoIG9mIHRoZSBhYm92ZSBzZWN0aW9ucyAoZXhjZXB0IGZvciB0aGUgZmFjZXMgc2VjdGlvbikgaXMgYSBsaXN0L3NldCBvZlxuICAgICB1bmlxdWUgdmVydGljZXMuXG5cbiAgICAgRWFjaCBsaW5lIG9mIHRoZSBmYWNlcyBzZWN0aW9uIGNvbnRhaW5zIGEgbGlzdCBvZlxuICAgICAodmVydGV4LCBbdGV4dHVyZV0sIG5vcm1hbCkgZ3JvdXBzXG4gICAgIFNvbWUgZXhhbXBsZXM6XG4gICAgICAgICAvLyB0aGUgdGV4dHVyZSBpbmRleCBpcyBvcHRpb25hbCwgYm90aCBmb3JtYXRzIGFyZSBwb3NzaWJsZSBmb3IgbW9kZWxzXG4gICAgICAgICAvLyB3aXRob3V0IGEgdGV4dHVyZSBhcHBsaWVkXG4gICAgICAgICBmIDEvMjUgMTgvNDYgMTIvMzFcbiAgICAgICAgIGYgMS8vMjUgMTgvLzQ2IDEyLy8zMVxuXG4gICAgICAgICAvLyBBIDMgdmVydGV4IGZhY2Ugd2l0aCB0ZXh0dXJlIGluZGljZXNcbiAgICAgICAgIGYgMTYvOTIvMTEgMTQvMTAxLzIyIDEvNjkvMVxuXG4gICAgICAgICAvLyBBIDQgdmVydGV4IGZhY2VcbiAgICAgICAgIGYgMTYvOTIvMTEgNDAvMTA5LzQwIDM4LzExNC8zOCAxNC8xMDEvMjJcblxuICAgICBUaGUgZmlyc3QgdHdvIGxpbmVzIGFyZSBleGFtcGxlcyBvZiBhIDMgdmVydGV4IGZhY2Ugd2l0aG91dCBhIHRleHR1cmUgYXBwbGllZC5cbiAgICAgVGhlIHNlY29uZCBpcyBhbiBleGFtcGxlIG9mIGEgMyB2ZXJ0ZXggZmFjZSB3aXRoIGEgdGV4dHVyZSBhcHBsaWVkLlxuICAgICBUaGUgdGhpcmQgaXMgYW4gZXhhbXBsZSBvZiBhIDQgdmVydGV4IGZhY2UuIE5vdGU6IGEgZmFjZSBjYW4gY29udGFpbiBOXG4gICAgIG51bWJlciBvZiB2ZXJ0aWNlcy5cblxuICAgICBFYWNoIG51bWJlciB0aGF0IGFwcGVhcnMgaW4gb25lIG9mIHRoZSBncm91cHMgaXMgYSAxLWJhc2VkIGluZGV4XG4gICAgIGNvcnJlc3BvbmRpbmcgdG8gYW4gaXRlbSBmcm9tIHRoZSBvdGhlciBzZWN0aW9ucyAobWVhbmluZyB0aGF0IGluZGV4aW5nXG4gICAgIHN0YXJ0cyBhdCBvbmUgYW5kICpub3QqIHplcm8pLlxuXG4gICAgIEZvciBleGFtcGxlOlxuICAgICAgICAgYGYgMTYvOTIvMTFgIGlzIHNheWluZyB0b1xuICAgICAgICAgICAtIHRha2UgdGhlIDE2dGggZWxlbWVudCBmcm9tIHRoZSBbdl0gdmVydGV4IGFycmF5XG4gICAgICAgICAgIC0gdGFrZSB0aGUgOTJuZCBlbGVtZW50IGZyb20gdGhlIFt2dF0gdGV4dHVyZSBhcnJheVxuICAgICAgICAgICAtIHRha2UgdGhlIDExdGggZWxlbWVudCBmcm9tIHRoZSBbdm5dIG5vcm1hbCBhcnJheVxuICAgICAgICAgYW5kIHRvZ2V0aGVyIHRoZXkgbWFrZSBhIHVuaXF1ZSB2ZXJ0ZXguXG4gICAgIFVzaW5nIGFsbCAzKyB1bmlxdWUgVmVydGljZXMgZnJvbSB0aGUgZmFjZSBsaW5lIHdpbGwgcHJvZHVjZSBhIHBvbHlnb24uXG5cbiAgICAgTm93LCB5b3UgY291bGQganVzdCBnbyB0aHJvdWdoIHRoZSBPQkogZmlsZSBhbmQgY3JlYXRlIGEgbmV3IHZlcnRleCBmb3JcbiAgICAgZWFjaCBmYWNlIGxpbmUgYW5kIFdlYkdMIHdpbGwgZHJhdyB3aGF0IGFwcGVhcnMgdG8gYmUgdGhlIHNhbWUgbW9kZWwuXG4gICAgIEhvd2V2ZXIsIHZlcnRpY2VzIHdpbGwgYmUgb3ZlcmxhcHBlZCBhbmQgZHVwbGljYXRlZCBhbGwgb3ZlciB0aGUgcGxhY2UuXG5cbiAgICAgQ29uc2lkZXIgYSBjdWJlIGluIDNEIHNwYWNlIGNlbnRlcmVkIGFib3V0IHRoZSBvcmlnaW4gYW5kIGVhY2ggc2lkZSBpc1xuICAgICAyIHVuaXRzIGxvbmcuIFRoZSBmcm9udCBmYWNlICh3aXRoIHRoZSBwb3NpdGl2ZSBaLWF4aXMgcG9pbnRpbmcgdG93YXJkc1xuICAgICB5b3UpIHdvdWxkIGhhdmUgYSBUb3AgUmlnaHQgdmVydGV4IChsb29raW5nIG9ydGhvZ29uYWwgdG8gaXRzIG5vcm1hbClcbiAgICAgbWFwcGVkIGF0ICgxLDEsMSkgVGhlIHJpZ2h0IGZhY2Ugd291bGQgaGF2ZSBhIFRvcCBMZWZ0IHZlcnRleCAobG9va2luZ1xuICAgICBvcnRob2dvbmFsIHRvIGl0cyBub3JtYWwpIGF0ICgxLDEsMSkgYW5kIHRoZSB0b3AgZmFjZSB3b3VsZCBoYXZlIGEgQm90dG9tXG4gICAgIFJpZ2h0IHZlcnRleCAobG9va2luZyBvcnRob2dvbmFsIHRvIGl0cyBub3JtYWwpIGF0ICgxLDEsMSkuIEVhY2ggZmFjZVxuICAgICBoYXMgYSB2ZXJ0ZXggYXQgdGhlIHNhbWUgY29vcmRpbmF0ZXMsIGhvd2V2ZXIsIHRocmVlIGRpc3RpbmN0IHZlcnRpY2VzXG4gICAgIHdpbGwgYmUgZHJhd24gYXQgdGhlIHNhbWUgc3BvdC5cblxuICAgICBUbyBzb2x2ZSB0aGUgaXNzdWUgb2YgZHVwbGljYXRlIFZlcnRpY2VzICh0aGUgYCh2ZXJ0ZXgsIFt0ZXh0dXJlXSwgbm9ybWFsKWBcbiAgICAgZ3JvdXBzKSwgd2hpbGUgaXRlcmF0aW5nIHRocm91Z2ggdGhlIGZhY2UgbGluZXMsIHdoZW4gYSBncm91cCBpcyBlbmNvdW50ZXJlZFxuICAgICB0aGUgd2hvbGUgZ3JvdXAgc3RyaW5nICgnMTYvOTIvMTEnKSBpcyBjaGVja2VkIHRvIHNlZSBpZiBpdCBleGlzdHMgaW4gdGhlXG4gICAgIHBhY2tlZC5oYXNoaW5kaWNlcyBvYmplY3QsIGFuZCBpZiBpdCBkb2Vzbid0LCB0aGUgaW5kaWNlcyBpdCBzcGVjaWZpZXNcbiAgICAgYXJlIHVzZWQgdG8gbG9vayB1cCBlYWNoIGF0dHJpYnV0ZSBpbiB0aGUgY29ycmVzcG9uZGluZyBhdHRyaWJ1dGUgYXJyYXlzXG4gICAgIGFscmVhZHkgY3JlYXRlZC4gVGhlIHZhbHVlcyBhcmUgdGhlbiBjb3BpZWQgdG8gdGhlIGNvcnJlc3BvbmRpbmcgdW5wYWNrZWRcbiAgICAgYXJyYXkgKGZsYXR0ZW5lZCB0byBwbGF5IG5pY2Ugd2l0aCBXZWJHTCdzIEVMRU1FTlRfQVJSQVlfQlVGRkVSIGluZGV4aW5nKSxcbiAgICAgdGhlIGdyb3VwIHN0cmluZyBpcyBhZGRlZCB0byB0aGUgaGFzaGluZGljZXMgc2V0IGFuZCB0aGUgY3VycmVudCB1bnBhY2tlZFxuICAgICBpbmRleCBpcyB1c2VkIGFzIHRoaXMgaGFzaGluZGljZXMgdmFsdWUgc28gdGhhdCB0aGUgZ3JvdXAgb2YgZWxlbWVudHMgY2FuXG4gICAgIGJlIHJldXNlZC4gVGhlIHVucGFja2VkIGluZGV4IGlzIGluY3JlbWVudGVkLiBJZiB0aGUgZ3JvdXAgc3RyaW5nIGFscmVhZHlcbiAgICAgZXhpc3RzIGluIHRoZSBoYXNoaW5kaWNlcyBvYmplY3QsIGl0cyBjb3JyZXNwb25kaW5nIHZhbHVlIGlzIHRoZSBpbmRleCBvZlxuICAgICB0aGF0IGdyb3VwIGFuZCBpcyBhcHBlbmRlZCB0byB0aGUgdW5wYWNrZWQgaW5kaWNlcyBhcnJheS5cbiAgICAgKi9cbiAgICB2YXIgdmVydHMgPSBbXSwgdmVydE5vcm1hbHMgPSBbXSwgdGV4dHVyZXMgPSBbXSwgdW5wYWNrZWQgPSB7fTtcbiAgICAvLyB1bnBhY2tpbmcgc3R1ZmZcbiAgICB1bnBhY2tlZC52ZXJ0cyA9IFtdO1xuICAgIHVucGFja2VkLm5vcm1zID0gW107XG4gICAgdW5wYWNrZWQudGV4dHVyZXMgPSBbXTtcbiAgICB1bnBhY2tlZC5oYXNoaW5kaWNlcyA9IHt9O1xuICAgIHVucGFja2VkLmluZGljZXMgPSBbXTtcbiAgICB1bnBhY2tlZC5pbmRleCA9IDA7XG4gICAgLy8gYXJyYXkgb2YgbGluZXMgc2VwYXJhdGVkIGJ5IHRoZSBuZXdsaW5lXG4gICAgdmFyIGxpbmVzID0gb2JqZWN0RGF0YS5zcGxpdCgnXFxuJyk7XG4gICAgXG4gICAgdmFyIFZFUlRFWF9SRSA9IC9edlxccy87XG4gICAgdmFyIE5PUk1BTF9SRSA9IC9edm5cXHMvO1xuICAgIHZhciBURVhUVVJFX1JFID0gL152dFxccy87XG4gICAgdmFyIEZBQ0VfUkUgPSAvXmZcXHMvO1xuICAgIHZhciBXSElURVNQQUNFX1JFID0gL1xccysvO1xuICAgIFxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBsaW5lID0gbGluZXNbaV0udHJpbSgpO1xuICAgICAgdmFyIGVsZW1lbnRzID0gbGluZS5zcGxpdChXSElURVNQQUNFX1JFKTtcbiAgICAgIGVsZW1lbnRzLnNoaWZ0KCk7XG4gICAgICBcbiAgICAgIGlmIChWRVJURVhfUkUudGVzdChsaW5lKSkge1xuICAgICAgICAvLyBpZiB0aGlzIGlzIGEgdmVydGV4XG4gICAgICAgIHZlcnRzLnB1c2guYXBwbHkodmVydHMsIGVsZW1lbnRzKTtcbiAgICAgIH0gZWxzZSBpZiAoTk9STUFMX1JFLnRlc3QobGluZSkpIHtcbiAgICAgICAgLy8gaWYgdGhpcyBpcyBhIHZlcnRleCBub3JtYWxcbiAgICAgICAgdmVydE5vcm1hbHMucHVzaC5hcHBseSh2ZXJ0Tm9ybWFscywgZWxlbWVudHMpO1xuICAgICAgfSBlbHNlIGlmIChURVhUVVJFX1JFLnRlc3QobGluZSkpIHtcbiAgICAgICAgLy8gaWYgdGhpcyBpcyBhIHRleHR1cmVcbiAgICAgICAgdGV4dHVyZXMucHVzaC5hcHBseSh0ZXh0dXJlcywgZWxlbWVudHMpO1xuICAgICAgfSBlbHNlIGlmIChGQUNFX1JFLnRlc3QobGluZSkpIHtcbiAgICAgICAgLy8gaWYgdGhpcyBpcyBhIGZhY2VcbiAgICAgICAgLypcbiAgICAgICAgc3BsaXQgdGhpcyBmYWNlIGludG8gYW4gYXJyYXkgb2YgdmVydGV4IGdyb3Vwc1xuICAgICAgICBmb3IgZXhhbXBsZTpcbiAgICAgICAgICAgZiAxNi85Mi8xMSAxNC8xMDEvMjIgMS82OS8xXG4gICAgICAgIGJlY29tZXM6XG4gICAgICAgICAgWycxNi85Mi8xMScsICcxNC8xMDEvMjInLCAnMS82OS8xJ107XG4gICAgICAgICovXG4gICAgICAgIHZhciBxdWFkID0gZmFsc2U7XG4gICAgICAgIGZvciAodmFyIGogPSAwLCBlbGVMZW4gPSBlbGVtZW50cy5sZW5ndGg7IGogPCBlbGVMZW47IGorKyl7XG4gICAgICAgICAgICAvLyBUcmlhbmd1bGF0aW5nIHF1YWRzXG4gICAgICAgICAgICAvLyBxdWFkOiAnZiB2MC90MC92bjAgdjEvdDEvdm4xIHYyL3QyL3ZuMiB2My90My92bjMvJ1xuICAgICAgICAgICAgLy8gY29ycmVzcG9uZGluZyB0cmlhbmdsZXM6XG4gICAgICAgICAgICAvLyAgICAgICdmIHYwL3QwL3ZuMCB2MS90MS92bjEgdjIvdDIvdm4yJ1xuICAgICAgICAgICAgLy8gICAgICAnZiB2Mi90Mi92bjIgdjMvdDMvdm4zIHYwL3QwL3ZuMCdcbiAgICAgICAgICAgIGlmKGogPT09IDMgJiYgIXF1YWQpIHtcbiAgICAgICAgICAgICAgICAvLyBhZGQgdjIvdDIvdm4yIGluIGFnYWluIGJlZm9yZSBjb250aW51aW5nIHRvIDNcbiAgICAgICAgICAgICAgICBqID0gMjtcbiAgICAgICAgICAgICAgICBxdWFkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGVsZW1lbnRzW2pdIGluIHVucGFja2VkLmhhc2hpbmRpY2VzKXtcbiAgICAgICAgICAgICAgICB1bnBhY2tlZC5pbmRpY2VzLnB1c2godW5wYWNrZWQuaGFzaGluZGljZXNbZWxlbWVudHNbal1dKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICBFYWNoIGVsZW1lbnQgb2YgdGhlIGZhY2UgbGluZSBhcnJheSBpcyBhIHZlcnRleCB3aGljaCBoYXMgaXRzXG4gICAgICAgICAgICAgICAgYXR0cmlidXRlcyBkZWxpbWl0ZWQgYnkgYSBmb3J3YXJkIHNsYXNoLiBUaGlzIHdpbGwgc2VwYXJhdGVcbiAgICAgICAgICAgICAgICBlYWNoIGF0dHJpYnV0ZSBpbnRvIGFub3RoZXIgYXJyYXk6XG4gICAgICAgICAgICAgICAgICAgICcxOS85Mi8xMSdcbiAgICAgICAgICAgICAgICBiZWNvbWVzOlxuICAgICAgICAgICAgICAgICAgICB2ZXJ0ZXggPSBbJzE5JywgJzkyJywgJzExJ107XG4gICAgICAgICAgICAgICAgd2hlcmVcbiAgICAgICAgICAgICAgICAgICAgdmVydGV4WzBdIGlzIHRoZSB2ZXJ0ZXggaW5kZXhcbiAgICAgICAgICAgICAgICAgICAgdmVydGV4WzFdIGlzIHRoZSB0ZXh0dXJlIGluZGV4XG4gICAgICAgICAgICAgICAgICAgIHZlcnRleFsyXSBpcyB0aGUgbm9ybWFsIGluZGV4XG4gICAgICAgICAgICAgICAgIFRoaW5rIG9mIGZhY2VzIGhhdmluZyBWZXJ0aWNlcyB3aGljaCBhcmUgY29tcHJpc2VkIG9mIHRoZVxuICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzIGxvY2F0aW9uICh2KSwgdGV4dHVyZSAodnQpLCBhbmQgbm9ybWFsICh2bikuXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgdmFyIHZlcnRleCA9IGVsZW1lbnRzWyBqIF0uc3BsaXQoICcvJyApO1xuICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgIFRoZSB2ZXJ0cywgdGV4dHVyZXMsIGFuZCB2ZXJ0Tm9ybWFscyBhcnJheXMgZWFjaCBjb250YWluIGFcbiAgICAgICAgICAgICAgICAgZmxhdHRlbmQgYXJyYXkgb2YgY29vcmRpbmF0ZXMuXG5cbiAgICAgICAgICAgICAgICAgQmVjYXVzZSBpdCBnZXRzIGNvbmZ1c2luZyBieSByZWZlcnJpbmcgdG8gdmVydGV4IGFuZCB0aGVuXG4gICAgICAgICAgICAgICAgIHZlcnRleCAoYm90aCBhcmUgZGlmZmVyZW50IGluIG15IGRlc2NyaXB0aW9ucykgSSB3aWxsIGV4cGxhaW5cbiAgICAgICAgICAgICAgICAgd2hhdCdzIGdvaW5nIG9uIHVzaW5nIHRoZSB2ZXJ0ZXhOb3JtYWxzIGFycmF5OlxuXG4gICAgICAgICAgICAgICAgIHZlcnRleFsyXSB3aWxsIGNvbnRhaW4gdGhlIG9uZS1iYXNlZCBpbmRleCBvZiB0aGUgdmVydGV4Tm9ybWFsc1xuICAgICAgICAgICAgICAgICBzZWN0aW9uICh2bikuIE9uZSBpcyBzdWJ0cmFjdGVkIGZyb20gdGhpcyBpbmRleCBudW1iZXIgdG8gcGxheVxuICAgICAgICAgICAgICAgICBuaWNlIHdpdGggamF2YXNjcmlwdCdzIHplcm8tYmFzZWQgYXJyYXkgaW5kZXhpbmcuXG5cbiAgICAgICAgICAgICAgICAgQmVjYXVzZSB2ZXJ0ZXhOb3JtYWwgaXMgYSBmbGF0dGVuZWQgYXJyYXkgb2YgeCwgeSwgeiB2YWx1ZXMsXG4gICAgICAgICAgICAgICAgIHNpbXBsZSBwb2ludGVyIGFyaXRobWV0aWMgaXMgdXNlZCB0byBza2lwIHRvIHRoZSBzdGFydCBvZiB0aGVcbiAgICAgICAgICAgICAgICAgdmVydGV4Tm9ybWFsLCB0aGVuIHRoZSBvZmZzZXQgaXMgYWRkZWQgdG8gZ2V0IHRoZSBjb3JyZWN0XG4gICAgICAgICAgICAgICAgIGNvbXBvbmVudDogKzAgaXMgeCwgKzEgaXMgeSwgKzIgaXMgei5cblxuICAgICAgICAgICAgICAgICBUaGlzIHNhbWUgcHJvY2VzcyBpcyByZXBlYXRlZCBmb3IgdmVydHMgYW5kIHRleHR1cmVzLlxuICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgIC8vIHZlcnRleCBwb3NpdGlvblxuICAgICAgICAgICAgICAgIHVucGFja2VkLnZlcnRzLnB1c2goK3ZlcnRzWyh2ZXJ0ZXhbMF0gLSAxKSAqIDMgKyAwXSk7XG4gICAgICAgICAgICAgICAgdW5wYWNrZWQudmVydHMucHVzaCgrdmVydHNbKHZlcnRleFswXSAtIDEpICogMyArIDFdKTtcbiAgICAgICAgICAgICAgICB1bnBhY2tlZC52ZXJ0cy5wdXNoKCt2ZXJ0c1sodmVydGV4WzBdIC0gMSkgKiAzICsgMl0pO1xuICAgICAgICAgICAgICAgIC8vIHZlcnRleCB0ZXh0dXJlc1xuICAgICAgICAgICAgICAgIGlmICh0ZXh0dXJlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgIHVucGFja2VkLnRleHR1cmVzLnB1c2goK3RleHR1cmVzWyh2ZXJ0ZXhbMV0gLSAxKSAqIDIgKyAwXSk7XG4gICAgICAgICAgICAgICAgICB1bnBhY2tlZC50ZXh0dXJlcy5wdXNoKCt0ZXh0dXJlc1sodmVydGV4WzFdIC0gMSkgKiAyICsgMV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyB2ZXJ0ZXggbm9ybWFsc1xuICAgICAgICAgICAgICAgIHVucGFja2VkLm5vcm1zLnB1c2goK3ZlcnROb3JtYWxzWyh2ZXJ0ZXhbMl0gLSAxKSAqIDMgKyAwXSk7XG4gICAgICAgICAgICAgICAgdW5wYWNrZWQubm9ybXMucHVzaCgrdmVydE5vcm1hbHNbKHZlcnRleFsyXSAtIDEpICogMyArIDFdKTtcbiAgICAgICAgICAgICAgICB1bnBhY2tlZC5ub3Jtcy5wdXNoKCt2ZXJ0Tm9ybWFsc1sodmVydGV4WzJdIC0gMSkgKiAzICsgMl0pO1xuICAgICAgICAgICAgICAgIC8vIGFkZCB0aGUgbmV3bHkgY3JlYXRlZCB2ZXJ0ZXggdG8gdGhlIGxpc3Qgb2YgaW5kaWNlc1xuICAgICAgICAgICAgICAgIHVucGFja2VkLmhhc2hpbmRpY2VzW2VsZW1lbnRzW2pdXSA9IHVucGFja2VkLmluZGV4O1xuICAgICAgICAgICAgICAgIHVucGFja2VkLmluZGljZXMucHVzaCh1bnBhY2tlZC5pbmRleCk7XG4gICAgICAgICAgICAgICAgLy8gaW5jcmVtZW50IHRoZSBjb3VudGVyXG4gICAgICAgICAgICAgICAgdW5wYWNrZWQuaW5kZXggKz0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGogPT09IDMgJiYgcXVhZCkge1xuICAgICAgICAgICAgICAgIC8vIGFkZCB2MC90MC92bjAgb250byB0aGUgc2Vjb25kIHRyaWFuZ2xlXG4gICAgICAgICAgICAgICAgdW5wYWNrZWQuaW5kaWNlcy5wdXNoKCB1bnBhY2tlZC5oYXNoaW5kaWNlc1tlbGVtZW50c1swXV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMudmVydGljZXMgPSB1bnBhY2tlZC52ZXJ0cztcbiAgICB0aGlzLnZlcnRleE5vcm1hbHMgPSB1bnBhY2tlZC5ub3JtcztcbiAgICB0aGlzLnRleHR1cmVzID0gdW5wYWNrZWQudGV4dHVyZXM7XG4gICAgdGhpcy5pbmRpY2VzID0gdW5wYWNrZWQuaW5kaWNlcztcbiAgfVxuXG4gIHZhciBBamF4ID0gZnVuY3Rpb24oKXtcbiAgICAvLyB0aGlzIGlzIGp1c3QgYSBoZWxwZXIgY2xhc3MgdG8gZWFzZSBhamF4IGNhbGxzXG4gICAgdmFyIF90aGlzID0gdGhpcztcbiAgICB0aGlzLnhtbGh0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24odXJsLCBjYWxsYmFjayl7XG4gICAgICBfdGhpcy54bWxodHRwLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGlmKF90aGlzLnhtbGh0dHAucmVhZHlTdGF0ZSA9PT0gNCl7XG4gICAgICAgICAgY2FsbGJhY2soX3RoaXMueG1saHR0cC5yZXNwb25zZVRleHQsIF90aGlzLnhtbGh0dHAuc3RhdHVzKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIF90aGlzLnhtbGh0dHAub3BlbignR0VUJywgdXJsLCB0cnVlKTtcbiAgICAgIF90aGlzLnhtbGh0dHAuc2VuZCgpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogVGFrZXMgaW4gYW4gb2JqZWN0IG9mIGBtZXNoX25hbWVgLCBgJy91cmwvdG8vT0JKL2ZpbGUnYCBwYWlycyBhbmQgYSBjYWxsYmFja1xuICAgKiBmdW5jdGlvbi4gRWFjaCBPQkogZmlsZSB3aWxsIGJlIGFqYXhlZCBpbiBhbmQgYXV0b21hdGljYWxseSBjb252ZXJ0ZWQgdG9cbiAgICogYW4gT0JKLk1lc2guIFdoZW4gYWxsIGZpbGVzIGhhdmUgc3VjY2Vzc2Z1bGx5IGRvd25sb2FkZWQgdGhlIGNhbGxiYWNrXG4gICAqIGZ1bmN0aW9uIHByb3ZpZGVkIHdpbGwgYmUgY2FsbGVkIGFuZCBwYXNzZWQgaW4gYW4gb2JqZWN0IGNvbnRhaW5pbmdcbiAgICogdGhlIG5ld2x5IGNyZWF0ZWQgbWVzaGVzLlxuICAgKlxuICAgKiAqKk5vdGU6KiogSW4gb3JkZXIgdG8gdXNlIHRoaXMgZnVuY3Rpb24gYXMgYSB3YXkgdG8gZG93bmxvYWQgbWVzaGVzLCBhXG4gICAqIHdlYnNlcnZlciBvZiBzb21lIHNvcnQgbXVzdCBiZSB1c2VkLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gbmFtZUFuZFVSTHMgYW4gb2JqZWN0IHdoZXJlIHRoZSBrZXkgaXMgdGhlIG5hbWUgb2YgdGhlIG1lc2ggYW5kIHRoZSB2YWx1ZSBpcyB0aGUgdXJsIHRvIHRoYXQgbWVzaCdzIE9CSiBmaWxlXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGNvbXBsZXRpb25DYWxsYmFjayBzaG91bGQgY29udGFpbiBhIGZ1bmN0aW9uIHRoYXQgd2lsbCB0YWtlIG9uZSBwYXJhbWV0ZXI6IGFuIG9iamVjdCBhcnJheSB3aGVyZSB0aGUga2V5cyB3aWxsIGJlIHRoZSB1bmlxdWUgb2JqZWN0IG5hbWUgYW5kIHRoZSB2YWx1ZSB3aWxsIGJlIGEgTWVzaCBvYmplY3RcbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IG1lc2hlcyBJbiBjYXNlIG90aGVyIG1lc2hlcyBhcmUgbG9hZGVkIHNlcGFyYXRlbHkgb3IgaWYgYSBwcmV2aW91c2x5IGRlY2xhcmVkIHZhcmlhYmxlIGlzIGRlc2lyZWQgdG8gYmUgdXNlZCwgcGFzcyBpbiBhIChwb3NzaWJseSBlbXB0eSkganNvbiBvYmplY3Qgb2YgdGhlIHBhdHRlcm46IHsgJzxtZXNoX25hbWU+JzogT0JKLk1lc2ggfVxuICAgKlxuICAgKi9cbiAgT0JKLmRvd25sb2FkTWVzaGVzID0gZnVuY3Rpb24gKG5hbWVBbmRVUkxzLCBjb21wbGV0aW9uQ2FsbGJhY2ssIG1lc2hlcyl7XG4gICAgLy8gdGhlIHRvdGFsIG51bWJlciBvZiBtZXNoZXMuIHRoaXMgaXMgdXNlZCB0byBpbXBsZW1lbnQgXCJibG9ja2luZ1wiXG4gICAgdmFyIHNlbWFwaG9yZSA9IE9iamVjdC5rZXlzKG5hbWVBbmRVUkxzKS5sZW5ndGg7XG4gICAgLy8gaWYgZXJyb3IgaXMgdHJ1ZSwgYW4gYWxlcnQgd2lsbCBnaXZlblxuICAgIHZhciBlcnJvciA9IGZhbHNlO1xuICAgIC8vIHRoaXMgaXMgdXNlZCB0byBjaGVjayBpZiBhbGwgbWVzaGVzIGhhdmUgYmVlbiBkb3dubG9hZGVkXG4gICAgLy8gaWYgbWVzaGVzIGlzIHN1cHBsaWVkLCB0aGVuIGl0IHdpbGwgYmUgcG9wdWxhdGVkLCBvdGhlcndpc2VcbiAgICAvLyBhIG5ldyBvYmplY3QgaXMgY3JlYXRlZC4gdGhpcyB3aWxsIGJlIHBhc3NlZCBpbnRvIHRoZSBjb21wbGV0aW9uQ2FsbGJhY2tcbiAgICBpZihtZXNoZXMgPT09IHVuZGVmaW5lZCkgbWVzaGVzID0ge307XG4gICAgLy8gbG9vcCBvdmVyIHRoZSBtZXNoX25hbWUsdXJsIGtleSx2YWx1ZSBwYWlyc1xuICAgIGZvcih2YXIgbWVzaF9uYW1lIGluIG5hbWVBbmRVUkxzKXtcbiAgICAgIGlmKG5hbWVBbmRVUkxzLmhhc093blByb3BlcnR5KG1lc2hfbmFtZSkpe1xuICAgICAgICBuZXcgQWpheCgpLmdldChuYW1lQW5kVVJMc1ttZXNoX25hbWVdLCAoZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAoZGF0YSwgc3RhdHVzKSB7XG4gICAgICAgICAgICBpZiAoc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgICAgbWVzaGVzW25hbWVdID0gbmV3IE9CSi5NZXNoKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgIGVycm9yID0gdHJ1ZTtcbiAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignQW4gZXJyb3IgaGFzIG9jY3VycmVkIGFuZCB0aGUgbWVzaCBcIicgK1xuICAgICAgICAgICAgICAgIG5hbWUgKyAnXCIgY291bGQgbm90IGJlIGRvd25sb2FkZWQuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyB0aGUgcmVxdWVzdCBoYXMgZmluaXNoZWQsIGRlY3JlbWVudCB0aGUgY291bnRlclxuICAgICAgICAgICAgc2VtYXBob3JlLS07XG4gICAgICAgICAgICBpZiAoc2VtYXBob3JlID09PSAwKSB7XG4gICAgICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgICAgIC8vIGlmIGFuIGVycm9yIGhhcyBvY2N1cnJlZCwgdGhlIHVzZXIgaXMgbm90aWZpZWQgaGVyZSBhbmQgdGhlXG4gICAgICAgICAgICAgICAgLy8gY2FsbGJhY2sgaXMgbm90IGNhbGxlZFxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0FuIGVycm9yIGhhcyBvY2N1cnJlZCBhbmQgb25lIG9yIG1lc2hlcyBoYXMgbm90IGJlZW4gJyArXG4gICAgICAgICAgICAgICAgICAnZG93bmxvYWRlZC4gVGhlIGV4ZWN1dGlvbiBvZiB0aGUgc2NyaXB0IGhhcyB0ZXJtaW5hdGVkLicpO1xuICAgICAgICAgICAgICAgIHRocm93ICcnO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vIHRoZXJlIGhhdmVuJ3QgYmVlbiBhbnkgZXJyb3JzIGluIHJldHJpZXZpbmcgdGhlIG1lc2hlc1xuICAgICAgICAgICAgICAvLyBjYWxsIHRoZSBjYWxsYmFja1xuICAgICAgICAgICAgICBjb21wbGV0aW9uQ2FsbGJhY2sobWVzaGVzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pKG1lc2hfbmFtZSkpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxuICB2YXIgX2J1aWxkQnVmZmVyID0gZnVuY3Rpb24oIGdsLCB0eXBlLCBkYXRhLCBpdGVtU2l6ZSApe1xuICAgIHZhciBidWZmZXIgPSBnbC5jcmVhdGVCdWZmZXIoKTtcbiAgICB2YXIgYXJyYXlWaWV3ID0gdHlwZSA9PT0gZ2wuQVJSQVlfQlVGRkVSID8gRmxvYXQzMkFycmF5IDogVWludDE2QXJyYXk7XG4gICAgZ2wuYmluZEJ1ZmZlcih0eXBlLCBidWZmZXIpO1xuICAgIGdsLmJ1ZmZlckRhdGEodHlwZSwgbmV3IGFycmF5VmlldyhkYXRhKSwgZ2wuU1RBVElDX0RSQVcpO1xuICAgIGJ1ZmZlci5pdGVtU2l6ZSA9IGl0ZW1TaXplO1xuICAgIGJ1ZmZlci5udW1JdGVtcyA9IGRhdGEubGVuZ3RoIC8gaXRlbVNpemU7XG4gICAgcmV0dXJuIGJ1ZmZlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBUYWtlcyBpbiB0aGUgV2ViR0wgY29udGV4dCBhbmQgYSBNZXNoLCB0aGVuIGNyZWF0ZXMgYW5kIGFwcGVuZHMgdGhlIGJ1ZmZlcnNcbiAgICogdG8gdGhlIG1lc2ggb2JqZWN0IGFzIGF0dHJpYnV0ZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fSBnbCB0aGUgYGNhbnZhcy5nZXRDb250ZXh0KCd3ZWJnbCcpYCBjb250ZXh0IGluc3RhbmNlXG4gICAqIEBwYXJhbSB7TWVzaH0gbWVzaCBhIHNpbmdsZSBgT0JKLk1lc2hgIGluc3RhbmNlXG4gICAqXG4gICAqIFRoZSBuZXdseSBjcmVhdGVkIG1lc2ggYXR0cmlidXRlcyBhcmU6XG4gICAqXG4gICAqIEF0dHJidXRlIHwgRGVzY3JpcHRpb25cbiAgICogOi0tLSB8IC0tLVxuICAgKiAqKm5vcm1hbEJ1ZmZlcioqICAgICAgIHxjb250YWlucyB0aGUgbW9kZWwmIzM5O3MgVmVydGV4IE5vcm1hbHNcbiAgICogbm9ybWFsQnVmZmVyLml0ZW1TaXplICB8c2V0IHRvIDMgaXRlbXNcbiAgICogbm9ybWFsQnVmZmVyLm51bUl0ZW1zICB8dGhlIHRvdGFsIG51bWJlciBvZiB2ZXJ0ZXggbm9ybWFsc1xuICAgKiB8XG4gICAqICoqdGV4dHVyZUJ1ZmZlcioqICAgICAgfGNvbnRhaW5zIHRoZSBtb2RlbCYjMzk7cyBUZXh0dXJlIENvb3JkaW5hdGVzXG4gICAqIHRleHR1cmVCdWZmZXIuaXRlbVNpemUgfHNldCB0byAyIGl0ZW1zXG4gICAqIHRleHR1cmVCdWZmZXIubnVtSXRlbXMgfHRoZSBudW1iZXIgb2YgdGV4dHVyZSBjb29yZGluYXRlc1xuICAgKiB8XG4gICAqICoqdmVydGV4QnVmZmVyKiogICAgICAgfGNvbnRhaW5zIHRoZSBtb2RlbCYjMzk7cyBWZXJ0ZXggUG9zaXRpb24gQ29vcmRpbmF0ZXMgKGRvZXMgbm90IGluY2x1ZGUgdylcbiAgICogdmVydGV4QnVmZmVyLml0ZW1TaXplICB8c2V0IHRvIDMgaXRlbXNcbiAgICogdmVydGV4QnVmZmVyLm51bUl0ZW1zICB8dGhlIHRvdGFsIG51bWJlciBvZiB2ZXJ0aWNlc1xuICAgKiB8XG4gICAqICoqaW5kZXhCdWZmZXIqKiAgICAgICAgfGNvbnRhaW5zIHRoZSBpbmRpY2VzIG9mIHRoZSBmYWNlc1xuICAgKiBpbmRleEJ1ZmZlci5pdGVtU2l6ZSAgIHxpcyBzZXQgdG8gMVxuICAgKiBpbmRleEJ1ZmZlci5udW1JdGVtcyAgIHx0aGUgdG90YWwgbnVtYmVyIG9mIGluZGljZXNcbiAgICpcbiAgICogQSBzaW1wbGUgZXhhbXBsZSAoYSBsb3Qgb2Ygc3RlcHMgYXJlIG1pc3NpbmcsIHNvIGRvbid0IGNvcHkgYW5kIHBhc3RlKTpcbiAgICpcbiAgICogICAgIHZhciBnbCAgID0gY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJyksXG4gICAqICAgICAgICAgbWVzaCA9IE9CSi5NZXNoKG9ial9maWxlX2RhdGEpO1xuICAgKiAgICAgLy8gY29tcGlsZSB0aGUgc2hhZGVycyBhbmQgY3JlYXRlIGEgc2hhZGVyIHByb2dyYW1cbiAgICogICAgIHZhciBzaGFkZXJQcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICAgKiAgICAgLy8gY29tcGlsYXRpb24gc3R1ZmYgaGVyZVxuICAgKiAgICAgLi4uXG4gICAqICAgICAvLyBtYWtlIHN1cmUgeW91IGhhdmUgdmVydGV4LCB2ZXJ0ZXggbm9ybWFsLCBhbmQgdGV4dHVyZSBjb29yZGluYXRlXG4gICAqICAgICAvLyBhdHRyaWJ1dGVzIGxvY2F0ZWQgaW4geW91ciBzaGFkZXJzIGFuZCBhdHRhY2ggdGhlbSB0byB0aGUgc2hhZGVyIHByb2dyYW1cbiAgICogICAgIHNoYWRlclByb2dyYW0udmVydGV4UG9zaXRpb25BdHRyaWJ1dGUgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcImFWZXJ0ZXhQb3NpdGlvblwiKTtcbiAgICogICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNoYWRlclByb2dyYW0udmVydGV4UG9zaXRpb25BdHRyaWJ1dGUpO1xuICAgKlxuICAgKiAgICAgc2hhZGVyUHJvZ3JhbS52ZXJ0ZXhOb3JtYWxBdHRyaWJ1dGUgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihzaGFkZXJQcm9ncmFtLCBcImFWZXJ0ZXhOb3JtYWxcIik7XG4gICAqICAgICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShzaGFkZXJQcm9ncmFtLnZlcnRleE5vcm1hbEF0dHJpYnV0ZSk7XG4gICAqXG4gICAqICAgICBzaGFkZXJQcm9ncmFtLnRleHR1cmVDb29yZEF0dHJpYnV0ZSA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHNoYWRlclByb2dyYW0sIFwiYVRleHR1cmVDb29yZFwiKTtcbiAgICogICAgIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHNoYWRlclByb2dyYW0udGV4dHVyZUNvb3JkQXR0cmlidXRlKTtcbiAgICpcbiAgICogICAgIC8vIGNyZWF0ZSBhbmQgaW5pdGlhbGl6ZSB0aGUgdmVydGV4LCB2ZXJ0ZXggbm9ybWFsLCBhbmQgdGV4dHVyZSBjb29yZGluYXRlIGJ1ZmZlcnNcbiAgICogICAgIC8vIGFuZCBzYXZlIG9uIHRvIHRoZSBtZXNoIG9iamVjdFxuICAgKiAgICAgT0JKLmluaXRNZXNoQnVmZmVycyhnbCwgbWVzaCk7XG4gICAqXG4gICAqICAgICAvLyBub3cgdG8gcmVuZGVyIHRoZSBtZXNoXG4gICAqICAgICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgbWVzaC52ZXJ0ZXhCdWZmZXIpO1xuICAgKiAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzaGFkZXJQcm9ncmFtLnZlcnRleFBvc2l0aW9uQXR0cmlidXRlLCBtZXNoLnZlcnRleEJ1ZmZlci5pdGVtU2l6ZSwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcbiAgICpcbiAgICogICAgIGdsLmJpbmRCdWZmZXIoZ2wuQVJSQVlfQlVGRkVSLCBtZXNoLnRleHR1cmVCdWZmZXIpO1xuICAgKiAgICAgZ2wudmVydGV4QXR0cmliUG9pbnRlcihzaGFkZXJQcm9ncmFtLnRleHR1cmVDb29yZEF0dHJpYnV0ZSwgbWVzaC50ZXh0dXJlQnVmZmVyLml0ZW1TaXplLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuICAgKlxuICAgKiAgICAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIG1lc2gubm9ybWFsQnVmZmVyKTtcbiAgICogICAgIGdsLnZlcnRleEF0dHJpYlBvaW50ZXIoc2hhZGVyUHJvZ3JhbS52ZXJ0ZXhOb3JtYWxBdHRyaWJ1dGUsIG1lc2gubm9ybWFsQnVmZmVyLml0ZW1TaXplLCBnbC5GTE9BVCwgZmFsc2UsIDAsIDApO1xuICAgKlxuICAgKiAgICAgZ2wuYmluZEJ1ZmZlcihnbC5FTEVNRU5UX0FSUkFZX0JVRkZFUiwgbW9kZWwubWVzaC5pbmRleEJ1ZmZlcik7XG4gICAqICAgICBnbC5kcmF3RWxlbWVudHMoZ2wuVFJJQU5HTEVTLCBtb2RlbC5tZXNoLmluZGV4QnVmZmVyLm51bUl0ZW1zLCBnbC5VTlNJR05FRF9TSE9SVCwgMCk7XG4gICAqL1xuICBPQkouaW5pdE1lc2hCdWZmZXJzID0gZnVuY3Rpb24oIGdsLCBtZXNoICl7XG4gICAgbWVzaC5ub3JtYWxCdWZmZXIgPSBfYnVpbGRCdWZmZXIoZ2wsIGdsLkFSUkFZX0JVRkZFUiwgbWVzaC52ZXJ0ZXhOb3JtYWxzLCAzKTtcbiAgICBtZXNoLnRleHR1cmVCdWZmZXIgPSBfYnVpbGRCdWZmZXIoZ2wsIGdsLkFSUkFZX0JVRkZFUiwgbWVzaC50ZXh0dXJlcywgMik7XG4gICAgbWVzaC52ZXJ0ZXhCdWZmZXIgPSBfYnVpbGRCdWZmZXIoZ2wsIGdsLkFSUkFZX0JVRkZFUiwgbWVzaC52ZXJ0aWNlcywgMyk7XG4gICAgbWVzaC5pbmRleEJ1ZmZlciA9IF9idWlsZEJ1ZmZlcihnbCwgZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIG1lc2guaW5kaWNlcywgMSk7XG4gIH1cblxuICBPQkouZGVsZXRlTWVzaEJ1ZmZlcnMgPSBmdW5jdGlvbiggZ2wsIG1lc2ggKXtcbiAgICBnbC5kZWxldGVCdWZmZXIobWVzaC5ub3JtYWxCdWZmZXIpO1xuICAgIGdsLmRlbGV0ZUJ1ZmZlcihtZXNoLnRleHR1cmVCdWZmZXIpO1xuICAgIGdsLmRlbGV0ZUJ1ZmZlcihtZXNoLnZlcnRleEJ1ZmZlcik7XG4gICAgZ2wuZGVsZXRlQnVmZmVyKG1lc2guaW5kZXhCdWZmZXIpO1xuICB9XG59KSgpO1xuXG4iLCJ2YXIgT0JKID0gcmVxdWlyZShcIndlYmdsLW9iai1sb2FkZXJcIilcblxudmFyIHJlcXVpcmVkQXNzZXRzID0ge1xuICBtZXNoZXM6IHtcbiAgICBwdW1wa2luOiBcIi9tZXNoZXMvcHVtcGtpbl90YWxsXzEway5vYmpcIiBcbiAgfVxufVxuXG5mdW5jdGlvbiBsb2FkQXNzZXRzIChhc3NldEhhc2gsIGNiKSB7XG4gIE9CSi5kb3dubG9hZE1lc2hlcyhhc3NldEhhc2gubWVzaGVzLCBmdW5jdGlvbiAobWVzaGVzKSB7IFxuICAgIGNiKG51bGwsIHttZXNoZXM6IG1lc2hlc30pIFxuICB9KVxufVxuXG5mdW5jdGlvbiBpbml0ICgpIHtcbiAgbG9hZEFzc2V0cyhyZXF1aXJlZEFzc2V0cywgZnVuY3Rpb24gKGVyciwgYXNzZXRzKSB7XG4gICAgY29uc29sZS5sb2coYXNzZXRzKSBcbiAgfSlcbn1cblxud2luZG93Lm9ubG9hZCA9IGluaXRcbiJdfQ==
