window.SS = window.SS || {};
SS.main = SS.main || {};

SS.main.main = function() {
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setClearColor(0x000000, 1);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.domElement.setAttribute('id', 'renderer');
	document.body.appendChild(renderer.domElement);
	
	scene = new THREE.Scene();
	var ratio = renderer.getContext().drawingBufferWidth / renderer.getContext().drawingBufferHeight;
	camera = new THREE.PerspectiveCamera(60, ratio, 0.1, 10000);
	editorCamera = new SS.util.EditorCamera(camera, document, 15, new THREE.Vector2(-Math.PI*(2/4),-Math.PI*(1/4)));
	
	SS.util.addResizeListener();
	SS.main.addSceneContent(scene);

	SS.main.render();
}

SS.main.render = function() {
	requestAnimationFrame(SS.main.render);
	
	time = window.time || new Date().getTime();
	var newTime = new Date().getTime();
	var diff = newTime - time;
	if (editorCamera.mouseDown == false) {
		editorCamera.cameraPos.x += diff/3000;
		editorCamera.cameraStartPos = editorCamera.cameraPos;
		editorCamera.rotateCamera();
	}
	time = newTime;
	
	renderer.render(scene, camera);
};

SS.main.addSceneContent = function(scene) {
	sunLight = new THREE.PointLight(new THREE.Color(0xffffff), 1.0);
	sunLight.position.set(100, 0, 0);
	scene.add(sunLight);
	
	scene.add(new SS.planet.Planet(5));
	
	//scene.add(new SS.starbox.StarBox(4000));
}