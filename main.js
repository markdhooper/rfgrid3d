import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'https://cdn.jsdelivr.net/npm/three@0.118.3/examples/jsm/libs/dat.gui.module.js';

let camera, scene, renderer;
let lightPoint;
let rfgrid_map, rfgrid_mask;
const light = new THREE.AmbientLight( 0x404040 ); // soft white light


class RfgridMap {
  constructor(dim={w:10,h:10},texture_path,pos={x:0,y:0,z:0},tile_count={x:10,y:10}){
    this.geometry = new THREE.PlaneGeometry(dim.w, dim.h, tile_count.x,tile_count.y);
    this.texture_path = texture_path;
    this.texture = new THREE.TextureLoader().load(this.texture_path,
        (tex) => {
          tex.needsUpdate = true;
          let x_scale = 1.0;
          let y_scale = x_scale * tex.image.height/tex.image.width;
          this.geometry.scale(x_scale, y_scale, 1.0);
          this.geometry.computeBoundingBox();
          this.boundingBox = this.geometry.boundingBox;
          this.map_width = (
            Math.abs(this.geometry.boundingBox.min.x) + 
            Math.abs(this.geometry.boundingBox.max.x)
            );
          this.map_height = (
              Math.abs(this.geometry.boundingBox.min.y) + 
              Math.abs(this.geometry.boundingBox.max.y)
          );
          this.tile_width = this.map_width / this.x_tile_count;
          this.tile_height = this.map_height / this.y_tile_count;
          this.mesh.position.x = (this.tile_width/2)*((this.x_tile_count%2));
          this.mesh.position.y = (this.tile_width/2)*((this.y_tile_count%2));
          console.log("map_width",this.map_width);
          console.log("map_height",this.map_height);
          console.log("image_width",tex.image.width);
          console.log("image_height",tex.image.height);
          
        });
    this.material = new THREE.MeshBasicMaterial({map:this.texture,wireframe:false});
    this.mesh = new THREE.Mesh(this.geometry,this.material);
    this.mesh.name = "rfgrid_map";
    this.mesh.position.x = pos.x;
    this.mesh.position.y = pos.y;
    this.mesh.position.z = pos.z;
    this.x_tile_count = tile_count.x;
    this.y_tile_count = tile_count.y;
    
  }
  updateTileCount(tc={x:this.x_tile_count,y:this.y_tile_count}){
    this.x_tile_count = tc.x;
    this.y_tile_count = tc.y;
    this.geometry = new THREE.PlaneGeometry(100, 100, tc.x,tc.y);
    this.texture = new THREE.TextureLoader().load(this.texture_path,
      (tex) => {
        this.geometry.needsUpdate = true;
        this.geometry.scale(1.0, tex.image.height / tex.image.width, 1.0);
        this.geometry.computeBoundingBox();
        this.boundingBox = this.geometry.boundingBox;
        this.map_width = (
          Math.abs(this.geometry.boundingBox.min.x) + 
          Math.abs(this.geometry.boundingBox.max.x)
          );
        this.map_height = (
            Math.abs(this.geometry.boundingBox.min.y) + 
            Math.abs(this.geometry.boundingBox.max.y)
        );
        this.tile_width = this.map_width / this.x_tile_count;
        this.tile_height = this.map_height / this.y_tile_count;
        this.mesh.material = this.material;
        this.mesh.geometry = this.geometry;
        this.mesh.position.x = (this.tile_width/2)*((this.x_tile_count%2));
        this.mesh.position.y = (this.tile_width/2)*((this.y_tile_count%2));
        console.log("map_width",this.map_width);
        console.log("map_height",this.map_height);
        console.log("image_width",tex.image.width);
        console.log("image_height",tex.image.height);
      });
    this.material = new THREE.MeshBasicMaterial({map:this.texture,wireframe:false});
  }
};

class RfgridMask {
  constructor(dim={w:10,h:10},texture_path,pos={x:0,y:0,z:0},tile_count={x:10,y:10},rfgridmap){
    this.geometry = new THREE.PlaneGeometry(dim.w, dim.h, tile_count.x,tile_count.y);
    this.texture_path = texture_path;
    this.texture = new THREE.TextureLoader().load(this.texture_path,
        (tex) => {
          this.geometry.needsUpdate = true;
          let x_scale = 8*(rfgrid_map.tile_width/10);
          let y_scale = 8*(rfgrid_map.tile_width/10);
          this.geometry.scale(x_scale, y_scale, 1.0);
          this.geometry.computeBoundingBox();
          this.map_width = (
            Math.abs(this.geometry.boundingBox.min.x) + 
            Math.abs(this.geometry.boundingBox.max.x)
            );
          this.map_height = (
              Math.abs(this.geometry.boundingBox.min.y) + 
              Math.abs(this.geometry.boundingBox.max.y)
          );
          console.log("map_width",this.map_width);
          console.log("map_height",this.map_height);
          console.log("image_width",tex.image.width);
          console.log("image_height",tex.image.height);
          var vFOV = camera.fov * Math.PI / 180; 
          let camera_pos = (this.map_height/8)/(2 * Math.tan( vFOV / 2 )); 
          console.log(camera_pos);
          camera.position.z = camera_pos;
        });
    this.material = new THREE.MeshStandardMaterial({alphaMap:this.texture,color:0x000000,transparent:true,opacity:0.75});
    this.mesh = new THREE.Mesh(this.geometry,this.material);
    this.mesh.position.x = pos.x;
    this.mesh.position.y = pos.y;
    this.mesh.position.z = pos.z;
    this.x_tile_count = tile_count.x;
    this.y_tile_count = tile_count.y;
  }
};


init();
animate();

function setupKeyControls() {
  document.onkeydown = function(e) {
    switch (e.key) {
      case 'E':
        rfgrid_map.mesh.position.y -= 0.1;
        break;
      case 'D':
        rfgrid_map.mesh.position.y += 0.1;
        break;
        case 'S':
          rfgrid_map.mesh.position.x += 0.1;
          break;
        case 'F':
          rfgrid_map.mesh.position.x -= 0.1;
          break;
      case 'e':
        rfgrid_map.mesh.position.y -= rfgrid_map.tile_width;
        break;
      case 'd':
        rfgrid_map.mesh.position.y += rfgrid_map.tile_width;
        break;
      case 's':
        rfgrid_map.mesh.position.x += rfgrid_map.tile_width;
        break;
      case 'f':
        rfgrid_map.mesh.position.x -= rfgrid_map.tile_width;
        break;
      case 'r':
        camera.position.z -= 2;
        break;
      case 'w':
        camera.position.z += 2;
        break;
      case 'W':
        camera.position.z += 0.1;
        break;
      case 'R':
        camera.position.z -= 0.1;
        break;
    }
  };
}

function setupGui() {
   let map_controls;
   let mask_controls;
   const gui = new GUI();
   // material (attributes)
   map_controls = gui.addFolder( "map controls" );
   map_controls.add(rfgrid_map.mesh.position, "z",0.0,100.0).listen();
   map_controls.add(rfgrid_map.mesh.position, "x",-100,100).listen();
   map_controls.add(rfgrid_map.mesh.position, "y",-100,100).listen();
   var tile_count = {x:rfgrid_map.x_tile_count,y:rfgrid_map.y_tile_count};
   
   map_controls.add(tile_count,"x",1,100).step(1).name("x_tiles").onChange(
    function(x_count) {
      tile_count.x = x_count;
      rfgrid_map.updateTileCount(tile_count);
    });

    map_controls.add(tile_count,"y",1,100).step(1).name("y_tiles").onChange(
      function(y_count) {
        tile_count.y = y_count;
        rfgrid_map.updateTileCount(tile_count);
      });
   map_controls.open();

  mask_controls = gui.addFolder( "mask controls" );
  mask_controls.add(rfgrid_mask.mesh.material, "wireframe",false).listen();
  mask_controls.add(rfgrid_mask.mesh.material, "transparent").listen();
  mask_controls.add(rfgrid_mask.mesh.material, "opacity",0.0,1.0).listen();
  var conf = { color : '#ffffff' };    
  mask_controls.addColor(conf, 'color').onChange( function(colorValue) {
    rfgrid_mask.mesh.material.color.set(colorValue);
  });
  mask_controls.open();
}


function init() {
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
  camera.position.z = 50;

  let game_maps = [
    {
      texture_path: "resources/textures/map1.jpg",
      tile_count: {x:30,y:35}
    },
    {
      texture_path: "resources/textures/map2.jpg",
      tile_count: {x:50,y:50}
    },
    {
      texture_path: "resources/textures/map3.jpg",
      tile_count: {x:50,y:50}
    },
    {
      texture_path: "resources/textures/map4.jpg",
      tile_count: {x:20,y:20}
    }
  ];

  const map_select = 1;
  const map_pos = {x:0.0,y:0.0,z:0.0};
  const map_dim = {w:100,h:100};

  scene = new THREE.Scene();
  rfgrid_map = new RfgridMap(map_dim,game_maps[map_select].texture_path,map_pos,game_maps[map_select].tile_count);
  scene.add( rfgrid_map.mesh );
  scene.add( light );
  rfgrid_mask = new RfgridMask(map_dim,"resources/textures/squareMask.png",map_pos,game_maps[map_select].tile_count,rfgrid_map);
  scene.add( rfgrid_mask.mesh );
  setupGui();
  
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );
  setupKeyControls();
  window.addEventListener( 'resize', onWindowResize );
  
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {
  requestAnimationFrame( animate );
  renderer.render( scene, camera );
}