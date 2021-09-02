import './style.css'

import * as THREE from 'three';

let camera, scene, renderer;
let lightPoint;
let rfgrid_map;
const light = new THREE.AmbientLight( 0x404040 ); // soft white light


class RfgridMap {
  constructor(dim={w:10,h:10},texture_path,pos={x:0,y:0,z:0},tile_count={x:10,y:10}){
    this.geometry = new THREE.PlaneGeometry(dim.w, dim.h, tile_count.x,tile_count.y);
    this.texture = new THREE.TextureLoader().load(texture_path,
        (tex) => {
          tex.needsUpdate = true;
          this.geometry.scale(1.0, tex.image.height / tex.image.width, 1.0);
          this.geometry.computeBoundingBox();
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
        });
    //this.material = new THREE.MeshBasicMaterial({map:this.texture});
    this.material = new THREE.MeshBasicMaterial({map:this.texture,color:0xd9e0e0,wireframe:false});
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
      case 'w':
        rfgrid_map.mesh.position.y -= rfgrid_map.tile_height;
        break;
      case 's':
        rfgrid_map.mesh.position.y += rfgrid_map.tile_height;
        break;
      case 'a':
        rfgrid_map.mesh.position.x += rfgrid_map.tile_width;
        break;
      case 'd':
        rfgrid_map.mesh.position.x -= rfgrid_map.tile_width;
        break;
      case 'q':
        rfgrid_map.mesh.position.z -= 0.1;
        break;
      case 'e':
        rfgrid_map.mesh.position.z += 0.1;
        break;
    }
  };
}

function init() {

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
  camera.position.z = 100;
  scene = new THREE.Scene();
  rfgrid_map = new RfgridMap({w:100,h:100},"textures/map.jpg",{x:0,y:0,z:0},{x:30,y:25});
  scene.add( rfgrid_map.mesh );
  scene.add( light );
  lightPoint = new THREE.PointLight(0xa080e0);
  lightPoint.position.set(10,10,1);
  scene.add(lightPoint);
  var sunGeo = new THREE.PlaneGeometry(100, 100);
  var sunMat = new THREE.MeshLambertMaterial({color: 0x00ff00});
  var sunMesh = new THREE.Mesh(sunGeo, sunMat);
  sunMesh.position.z = -1;
  scene.add(sunMesh);

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
