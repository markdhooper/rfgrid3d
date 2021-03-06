import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118/build/three.module.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.118/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'https://cdn.jsdelivr.net/npm/three@0.118.3/examples/jsm/libs/dat.gui.module.js';

let camera, scene, renderer;
let rfgrid_map, rfgrid_mask;

let game_maps = {
  chapel:{
    texture_path: "resources/textures/chapel.jpg",
    tile_count: {x:18,y:28}
  },
  city:{
    texture_path: "resources/textures/cityStreets.jpg",
    tile_count: {x:35,y:35}
  },
  town_gate:{
    texture_path: "resources/textures/townGate.jpg",
    tile_count: {x:30,y:35}
  },
  labyrinth:{
    texture_path: "resources/textures/labyrinth.jpg",
    tile_count: {x:50,y:50}
  }
};

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
          rfgrid_mask = new RfgridMask(dim,"resources/textures/squareMask.png",pos,tile_count,this.tile_width);
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
};

class RfgridMask {
  constructor(dim={w:10,h:10},texture_path,pos={x:0,y:0,z:0},tile_count={x:10,y:10},tile_width){
    this.geometry = new THREE.PlaneGeometry(dim.w, dim.h, tile_count.x,tile_count.y);
    this.texture_path = texture_path;
    this.texture = new THREE.TextureLoader().load(this.texture_path,
        (tex) => {
          this.geometry.needsUpdate = true;
          let x_scale = 8*(tile_width/10);
          let y_scale = 8*(tile_width/10);
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
          let play_area = 8;  //8x8 tile area.
          let menu_area = 2;  //menu is two rows tall
          let tile_margin = 1; //default border (in tiles).
          let vFOV = camera.fov * Math.PI / 180; 
          let camera_pos = (this.map_height/10)*((menu_area+play_area+tile_margin*2)/play_area)/(2 * Math.tan( vFOV / 2 )); 
          camera.position.z = camera_pos;
          camera.position.y = tile_width;
          scene.add(rfgrid_map.mesh);
          scene.add(this.mesh);
          
        });
    this.material = new THREE.MeshStandardMaterial({alphaMap:this.texture,color:0x000000,transparent:true,opacity:0.75});
    this.mesh = new THREE.Mesh(this.geometry,this.material);
    this.mesh.name = "rfgrid_mask";
    this.mesh.position.x = pos.x;
    this.mesh.position.y = pos.y;
    this.mesh.position.z = pos.z;
    this.x_tile_count = tile_count.x;
    this.y_tile_count = tile_count.y;
  }
};

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
  const gui = new GUI();

  let map_dropdown = {
    map_selection: Object.keys(game_maps)[0]
  }

  gui.add(map_dropdown,"map_selection",Object.keys(game_maps)).onChange(
    (map_key) => {
      const map_pos = {x:0.0,y:0.0,z:0.0};
      const map_dim = {w:100,h:100};

      scene.remove(rfgrid_mask.mesh);
      rfgrid_mask.geometry.dispose();
      rfgrid_mask.material.dispose();
      rfgrid_mask.texture.dispose();

      scene.remove(rfgrid_map.mesh);
      rfgrid_map.geometry.dispose();
      rfgrid_map.material.dispose();
      rfgrid_map.texture.dispose();

      rfgrid_map = new RfgridMap(map_dim,game_maps[map_key].texture_path,map_pos,game_maps[map_key].tile_count);
      animate();

    }
  );

  let camera_controls;
  camera_controls = gui.addFolder( "camera_position" );
  camera_controls.add(camera.position,"z",10,200).step(1).listen();
  camera_controls.add(camera.position,"x",-50,50).step(1).listen();
  camera_controls.add(camera.position,"y",-50,50).step(1).listen();
  camera_controls.open();

}

function init() {
  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
  camera.position.z = 50;
  const light = new THREE.AmbientLight( 0x404040 ); 
  scene = new THREE.Scene();

  const map_pos = {x:0.0,y:0.0,z:0.0};
  const map_dim = {w:100,h:100};
  
  rfgrid_map = new RfgridMap(map_dim,game_maps["chapel"].texture_path,map_pos,game_maps["chapel"].tile_count);
  scene.add( light );


  scene.add(light);
  setupGui();
  setupKeyControls();
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );
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

init();
animate();