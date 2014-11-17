"use strict";

window.SS = window.SS || {};
SS.main = SS.main || {};

SS.main.main = function() {
	window.renderer = new THREE.WebGLRenderer({antialias: true});
	var renderer = window.renderer;
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setClearColor(0x000000, 1);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.domElement.setAttribute('id', 'renderer');
	document.body.appendChild(renderer.domElement);
	
	window.scene = new THREE.Scene();
	var ratio = renderer.getContext().drawingBufferWidth / renderer.getContext().drawingBufferHeight;
	window.camera = new THREE.PerspectiveCamera(60, ratio, 0.1, 10000);
	window.editorCamera = new SS.util.EditorCamera(camera, document, 15, new THREE.Vector2(-Math.PI*(1/4),-Math.PI*(1/4)));
	
	SS.util.addResizeListener();
	SS.main.addSceneContent(scene);

	SS.main.render();
}

SS.main.render = function() {
	requestAnimationFrame(SS.main.render);
	
	window.time = window.time || new Date().getTime();
	var newTime = new Date().getTime();
	var diff = newTime - time;
	if (editorCamera.mouseDown == false) {
		editorCamera.cameraPos.x += diff/1000*(2*3.1415)*(1/3600/24)*3000;
		editorCamera.cameraStartPos = editorCamera.cameraPos;
		editorCamera.rotateCamera();
	}
	time = newTime;
	
	window.renderer.render(window.scene, window.camera);
};

SS.main.addSceneContent = function(scene) {
	window.sunLight = new THREE.PointLight(new THREE.Color(0xffffff), 1.0);
	sunLight.position.set(100, 0, 0);
	scene.add(sunLight);
	
	var textureMaps = [];
	var bumpMaps = [];
	var resolution = 1024;
	for (var index = 0; index < 6; index++) {
		var texture = new THREE.WebGLRenderTarget(resolution, resolution, {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat});
		
		var textureCamera = new THREE.OrthographicCamera(-resolution/2, resolution/2, resolution/2, -resolution/2, -100, 100);
		textureCamera.position.z = 10;
		
		var textureScene = new THREE.Scene();
		var plane = new THREE.Mesh(
			new THREE.PlaneGeometry(resolution, resolution), 
			new SS.material.shaderMaterial2(index)
		);
		plane.position.z = -10;
		textureScene.add(plane);
		
		renderer.render(textureScene, textureCamera, texture, true);
		
		var buffer = new Uint8Array(resolution * resolution * 4);
		var gl = renderer.getContext();
		gl.readPixels( 0, 0, resolution, resolution, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
		
		textureMaps.push(texture);
		bumpMaps.push({image: {data: buffer, height: resolution, width: resolution}});
	}
	
	scene.add(new SS.planet.Planet(5, textureMaps, bumpMaps));
	
	//scene.add(new SS.starbox.StarBox(4000));
}