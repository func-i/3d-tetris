//On Load, setup
var theGame;
window.addEventListener("load", function(){
  theGame = new GameController();
  theGame.play()
});

window.addEventListener('keydown', function (event) {
  if(theGame === undefined || theGame.currentBlock === undefined) return;

  var key = event.which ? event.which : event.keyCode;

  switch(key) {
    case 38: // up (arrow)
      theGame.currentBlock.move(0, 1, 0);
      break;
    case 40: // down (arrow)
      theGame.currentBlock.move(0, -1, 0);
      break;
    case 37: // left(arrow)
      theGame.currentBlock.move(-1, 0, 0);
      break;
    case 39: // right (arrow)
      theGame.currentBlock.move(1, 0, 0);
      break;
    case 32: // space
      theGame.currentBlock.move(0, 0, -1);
      break;

    case 87: // up (w)
      theGame.currentBlock.rotate(90, 0, 0);
      break;
    case 83: // down (s)
      theGame.currentBlock.rotate(-90, 0, 0);
      break;

    case 65: // left(a)
      theGame.currentBlock.rotate(0, 0, 90);
      break;
    case 68: // right (d)
      theGame.currentBlock.rotate(0, 0, -90);
      break;

    case 81: // (q)
      theGame.currentBlock.rotate(0, 90, 0);
      break;
    case 69: // (e)
      theGame.currentBlock.rotate(0, -90, 0);
      break;
  }
}, false);


function GameController(){
  this.setupThreeJS();
  this.setupBoard();
};

GameController.prototype.setupThreeJS = function(){
  // set the scene size
  var WIDTH = window.innerWidth,
      HEIGHT = window.innerHeight;

  // set some camera attributes
  var VIEW_ANGLE = 45,
      ASPECT = WIDTH / HEIGHT,
      NEAR = 0.1,
      FAR = 10000;

  // create a WebGL renderer, camera
  // and a scene
  this.renderer = new THREE.WebGLRenderer();
  this.camera = new THREE.PerspectiveCamera(
    VIEW_ANGLE,
    ASPECT,
    NEAR,
    FAR
  );
  this.scene = new THREE.Scene();

  // the camera starts at 0,0,0 so pull it back
  this.camera.position.z = 600;
  this.scene.add(this.camera);

  // start the renderer
  this.renderer.setSize(WIDTH, HEIGHT);

  // attach the render-supplied DOM element
  document.body.appendChild(this.renderer.domElement);
};

GameController.prototype.setupBoard = function(){
  // configuration object
  var boundingBoxConfig = {
    width: 360,
    height: 360,
    depth: 1200,
    splitX: 6,
    splitY: 6,
    splitZ: 20
  };

  this.boundingBoxConfig = boundingBoxConfig;
  this.blockSize = boundingBoxConfig.width/boundingBoxConfig.splitX;

  this.board = new Board(this);
  this.board.generate();
}

GameController.prototype.play = function(){
  this.gameStepTime = 1000;

  this.frameTime = 0; // ms
  this.cumulatedFrameTime = 0; // ms
  this._lastFrameTime = Date.now(); // timestamp

  this.gameOver = false;

  this.generateCurrentBlock();

  this.animate();
};

GameController.prototype.generateCurrentBlock = function(){
  this.currentBlock = new Block(this.blockSize, this);
  this.currentBlock.generate();

  if (this.board.testCollision(true) === Board.COLLISION.GROUND) {
    this.gameOver = true;
  }
};

GameController.prototype.animate = function(){
  var time = Date.now();
  this.frameTime = time - this._lastFrameTime;
  this._lastFrameTime = time;
  this.cumulatedFrameTime += this.frameTime;

  while(this.cumulatedFrameTime > this.gameStepTime) {
    // block movement will go here
    this.cumulatedFrameTime -= this.gameStepTime;
    this.currentBlock.move(0,0,-1);
  }

  this.renderer.render(this.scene, this.camera);

  //this.stats.update();

  if(!this.gameOver) window.requestAnimationFrame(this.animate.bind(this));
}

function Camera(){

};

function Board(gameController){
  this.gameController = gameController;
  this.blockSize = gameController.blockSize;
  this.boundingBoxConfig = gameController.boundingBoxConfig;

  for(var x = 0; x < this.boundingBoxConfig.splitX; x++) {
    this.fields[x] = [];
    for(var y = 0; y < this.boundingBoxConfig.splitY; y++) {
      this.fields[x][y] = [];
      for(var z = 0; z < this.boundingBoxConfig.splitZ; z++) {
        this.fields[x][y][z] = Board.FIELD.EMPTY;
      }
    }
  }
};

Board.ZCOLORS = [
  0x6666ff, 0x66ffff, 0xcc68EE, 0x666633, 0x66ff66, 0x9966ff, 0x00ff66, 0x66EE33, 0x003399, 0x330099, 0xFFA500, 0x99ff00, 0xee1289, 0x71C671, 0x00BFFF, 0x666633, 0x669966, 0x9966ff
];
Board.COLLISION = { NONE: 0, WALL: 1, GROUND: 2 };
Board.FIELD = { EMPTY: 0, ACTIVE: 1, PETRIFIED: 2 };

Board.prototype.staticBlocks = [];
Board.prototype.fields = [];

Board.prototype.generate = function(){
  var boundingBox = new THREE.Mesh(
    new THREE.CubeGeometry(
      this.boundingBoxConfig.width,
      this.boundingBoxConfig.height,
      this.boundingBoxConfig.depth,
      this.boundingBoxConfig.splitX,
      this.boundingBoxConfig.splitY,
      this.boundingBoxConfig.splitZ
    ),
    new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      wireframe: true
    })
  );
  this.gameController.scene.add(boundingBox);

  // first render
  this.gameController.renderer.render(this.gameController.scene, this.gameController.camera);
};

Board.prototype.addStaticBlock = function(x,y,z) {
  if(this.staticBlocks[x] === undefined) this.staticBlocks[x] = [];
  if(this.staticBlocks[x][y] === undefined) this.staticBlocks[x][y] = [];

  var mesh = THREE.SceneUtils.createMultiMaterialObject(
    new THREE.CubeGeometry
    (
      this.blockSize, this.blockSize, this.blockSize
    ),
    [
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        shading: THREE.FlatShading,
        wireframe: true,
        transparent: true
      }),
      new THREE.MeshBasicMaterial({
        color: Board.ZCOLORS[z]
      })
    ]
  );

  mesh.position.x = (x - this.boundingBoxConfig.splitX/2)*this.blockSize + this.blockSize/2;
  mesh.position.y = (y - this.boundingBoxConfig.splitY/2)*this.blockSize + this.blockSize/2;
  mesh.position.z = (z - this.boundingBoxConfig.splitZ/2)*this.blockSize + this.blockSize/2;
  mesh.overdraw = true;

  this.gameController.scene.add(mesh);

  this.staticBlocks[x][y][z] = mesh;

  this.fields[x][y][z] = Board.FIELD.PETRIFIED;
};

Board.prototype.testCollision = function(ground_check){
  var x, y, z, i;

  var posx = this.gameController.currentBlock.position.x,
      posy = this.gameController.currentBlock.position.y,
      posz = this.gameController.currentBlock.position.z,
      shape = this.gameController.currentBlock.shape;

  for (i = 0; i < shape.length; i++) {
    // 4 walls detection for every part of the shape
    if ((shape[i].x + posx) < 0 ||
        (shape[i].y + posy) < 0 ||
        (shape[i].x + posx) >= this.fields.length ||
        (shape[i].y + posy) >= this.fields[0].length)
    {
      return Board.COLLISION.WALL;
    }
    else if (this.fields[shape[i].x + posx][shape[i].y + posy][shape[i].z + posz - 1] === Board.FIELD.PETRIFIED)
    {
      return ground_check ? Board.COLLISION.GROUND : Board.COLLISION.WALL;
    }
    else if((shape[i].z + posz) <= 0) {
      return Board.COLLISION.GROUND;
    }
  } 
}


function Block(blockSize, gameController){
  this.blockSize = blockSize;
  this.boundingBoxConfig = gameController.boundingBoxConfig;
  this.gameController = gameController;
};

Block.prototype.position = {};

Block.prototype.generate = function() {
  var geometry, tmpGeometry;

  var type = Math.floor(Math.random()*(Block.shapes.length));
  this.blockType = type;

  this.shape = [];
  for(var i = 0; i < Block.shapes[type].length; i++) {
    this.shape[i] = cloneVector(Block.shapes[type][i]);
  }

  geometry = new THREE.CubeGeometry(this.blockSize, this.blockSize, this.blockSize);

  for(var i = 1 ; i < this.shape.length; i++) {
    tmpGeometry = new THREE.Mesh(new THREE.CubeGeometry(this.blockSize, this.blockSize, this.blockSize));
    tmpGeometry.position.x = this.blockSize * this.shape[i].x;
    tmpGeometry.position.y = this.blockSize * this.shape[i].y;
    THREE.GeometryUtils.merge(geometry, tmpGeometry);
  }

  this.mesh = THREE.SceneUtils.createMultiMaterialObject(
    geometry,
    [
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        shading: THREE.FlatShading,
        wireframe: true,
        transparent: true
      }),
      new THREE.MeshBasicMaterial({color: 0xff0000})
    ]
  );

  this.setInitialPosition();
};

Block.prototype.setInitialPosition = function(){
  // initial position
  this.position = {
    x: Math.floor(this.boundingBoxConfig.splitX/2)-1,
    y: Math.floor(this.boundingBoxConfig.splitY/2)-1,
    z: 15
  };

  this.mesh.position.x = (this.position.x - this.boundingBoxConfig.splitX/2)*this.blockSize/2;
  this.mesh.position.y = (this.position.y - this.boundingBoxConfig.splitY/2)*this.blockSize/2;
  this.mesh.position.z = (this.position.z - this.boundingBoxConfig.splitZ/2)*this.blockSize + this.blockSize/2;
  this.mesh.rotation.x = 0;
  this.mesh.rotation.y = 0;
  this.mesh.rotation.z = 0;
  this.mesh.overdraw = true;

  this.gameController.scene.add(this.mesh);
};

Block.prototype.rotate = function(x,y,z) {
  this.mesh.rotation.x += x * Math.PI / 180;
  this.mesh.rotation.y += y * Math.PI / 180;
  this.mesh.rotation.z += z * Math.PI / 180;

  var rotationMatrix = new THREE.Matrix4();
  rotationMatrix.makeRotationFromEuler(this.mesh.rotation);

  for (var i = 0; i < this.shape.length; i++) {
    var threeVector = new THREE.Vector3(Block.shapes[this.blockType][i].x, Block.shapes[this.blockType][i].y, Block.shapes[this.blockType][i].z);
    rotatedVector = threeVector.applyMatrix4(rotationMatrix);
    this.shape[i] = {
      x: rotatedVector.x,
      y: rotatedVector.y,
      z: rotatedVector.z
    }
    roundVector(this.shape[i]);
  }

  if (this.gameController.board.testCollision(false) === Board.COLLISION.WALL) {
    this.rotate(-x, -y, -z);
  }
};

Block.prototype.move = function(x,y,z) {
  this.mesh.position.x += x*this.blockSize;
  this.position.x += x;

  this.mesh.position.y += y*this.blockSize;
  this.position.y += y;

  this.mesh.position.z += z*this.blockSize;
  this.position.z += z;
  if(this.position.z == 0) this.hitBottom();

  var collision = this.gameController.board.testCollision((z != 0));
  if (collision === Board.COLLISION.WALL) {
    this.move(-x, -y, 0);
  }
  if (collision === Board.COLLISION.GROUND) {
    this.hitBottom();
  }
};

Block.prototype.hitBottom = function() {
  this.petrify();
  this.gameController.scene.remove(this.mesh);
  this.gameController.generateCurrentBlock();
};

Block.prototype.petrify = function() {
  var shape = this.shape;
  for(var i = 0 ; i < shape.length; i++) {
    this.gameController.board.addStaticBlock(this.position.x + shape[i].x, this.position.y + shape[i].y, this.position.z + shape[i].z);
  }
};

Block.shapes = [
    [
        {x: 0, y: 0, z: 0},
        {x: 1, y: 0, z: 0},
        {x: 1, y: 1, z: 0},
        {x: 1, y: 2, z: 0}
    ],
    [
        {x: 0, y: 0, z: 0},
        {x: 0, y: 1, z: 0},
        {x: 0, y: 2, z: 0},
    ],
    [
        {x: 0, y: 0, z: 0},
        {x: 0, y: 1, z: 0},
        {x: 1, y: 0, z: 0},
        {x: 1, y: 1, z: 0}
    ],
    [
        {x: 0, y: 0, z: 0},
        {x: 0, y: 1, z: 0},
        {x: 0, y: 2, z: 0},
        {x: 1, y: 1, z: 0}
    ],
    [
        {x: 0, y: 0, z: 0},
        {x: 0, y: 1, z: 0},
        {x: 1, y: 1, z: 0},
        {x: 1, y: 2, z: 0}
    ]
];

function cloneVector(v) {
  return {x: v.x, y: v.y, z: v.z};
};

function roundVector(v) {
  v.x = Math.round(v.x);
  v.y = Math.round(v.y);
  v.z = Math.round(v.z);
};

window.requestAnimationFrame = (function()
{
  return window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function(callback) {
    window.setTimeout( callback, 1000 / 60 );
  };
})();

