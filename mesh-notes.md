#JSON Schema for Mesh on Disk
name:      "capsule"
meshName:  "/meshes/capsule.obj"
textures: [
  name: main, path: "/textures/capsule.png"
]
program:
  name:    "standard"
  vertex:  "/shaders/standardV.glsl"
  fragment "/shaders/standardF.glsl"

#Runtime schema CPU Mesh
name: "capsule"
attributes: [
  name: "vertices", data: []
  name: "normals",  data: []
  name: "uvs",      data: []
  name: "indices",  data: []
]
program:  
  name: "standard"
  vSrc: "asklfdjahslfkjahslkjfh"
  fSrc: "akl;sjfghlaskjgfhaslkjgh"
textures: [
  name: "main", image: Image
  ...
]

#Runtime schema for buffered mesh
name:         String
indexCount:   Number
namedBuffers: {}

#Runtime schema for stored programs
name:    String
program: Program

#Runtime schema for buffered textures
name:    String
texture: WebGLTexture
index:   Number (-1 means not currently in GPU memory)

renderer:
  activeMesh: "capsule" //or reference directly?
  bufferedMeshes:
    capsule: BufferedMesh
    teapot:  BufferedMesh

  activeProgram: "standard"
  storedPrograms:
    standard: WebGLProgram
    fireball: WebGlProgram

  bufferedTextures: 
    capsule: BufferedTexture 
    teapot:  BufferedTexture
