window.SS = window.SS || {};
SS.util = SS.util || {};

SS.util.clamp = function(number, from, to) {
	return Math.max(Math.min(number, to), from);
}

SS.util.randomInt = function(from, to, seed) {
	return Math.floor(SS.util.randomFloat(from, to+1, seed));
}

SS.util.randomFloat = function(from, to, seed) {
	return SS.util.random(seed)*(to-from)+from;
}

SS.util.random = function(seed) {
	var scope = arguments.callee;
	
	scope.MAX = scope.MAX || Math.pow(2, 32);
	scope.a = 1664525;
	scope.c = 1013904223;
	
	scope.seeds = scope.seeds || {};

	seed = seed || 0;
	var key = seed;
	if (typeof seed == "string") {
		if (scope.seeds[seed] == undefined) {
			var numeric = SS.util.numberFromString(seed);
			scope.seeds[seed] = numeric; // Memoization
			seed = numeric;
		} else {
			seed = scope.seeds[seed];
		}
	} 
	scope.series = scope.series || {};
	scope.series[key] = scope.series[key] || seed;
	
	var lastRandom = scope.series[key];
	var newRandom = (scope.a * lastRandom + scope.c) % scope.MAX;
	
	scope.series[key] = newRandom;
	
	return newRandom/scope.MAX;
}

SS.util.resetRandomSeries = function(prefix) {
	var toBeCleared = [];
	for (var i in SS.util.random.series) {
		if (i.indexOf(prefix) == 0) toBeCleared.push(i);
	}
	for (var i in toBeCleared) {
		delete SS.util.random.series[toBeCleared[i]];
	}
}

SS.util.makeSpecifiedArray1D = function(size, value, array) {
	var valueFloat = value;
	for (var x = 0; x < size; x++) {
		if (typeof(value) == "function") valueFloat = value(x);
		array[x] = valueFloat;
	}
	return array;
}

window.N = 256*256;
window.G = SS.util.makeSpecifiedArray1D(N, Math.random, new Float32Array(N));
window.P = SS.util.makeSpecifiedArray1D(N, function() {return SS.util.randomInt(0, N-1)}, new Uint32Array(N));

SS.util.random4 = function(i, j, k) {
	return G[(i + P[(j + P[k % N]) % N]) % N];
}

SS.util.EditorCamera = function(camera, document, startRadius, cameraStartPos, originObject) {
	this.camera = camera;
	this.mouseDown = false;
	this.startRadius = startRadius || 20;
	this.startExp = 6;
	this.radius = this.startExp;
	this.originObject = originObject || {position: new THREE.Vector3()};
	this.cameraStartPos = cameraStartPos || new THREE.Vector2(Math.PI/8, -Math.PI/4);
	this.cameraPos = this.cameraStartPos.clone();
	this.mouseClickPos = new THREE.Vector2();
	
	var editorCamera = this;
	
	var addEventListeners = function() {
		document.addEventListener('mousemove', function(event) {
			var mousePos = new THREE.Vector2(event.clientX, event.clientY);
			if (editorCamera.mouseDown == true) {
				var diff = mousePos.clone().sub(editorCamera.mouseClickPos).multiplyScalar(1/250);
				editorCamera.cameraPos = editorCamera.cameraStartPos.clone().add(diff);
				editorCamera.rotateCamera();
			}
		});
		
		document.addEventListener('mousewheel', function(event) {
			var delta = event.wheelDelta/10000;
			if (editorCamera.getScaledRadius(editorCamera.radius - delta) >= 0) {
				editorCamera.radius -= delta;
				editorCamera.zoomCamera();
			}
		});
		
		document.addEventListener('mousedown', function(event) {
			var mousePos = new THREE.Vector2(event.clientX, event.clientY);			
			editorCamera.mouseClickPos = mousePos;
			editorCamera.mouseDown = true;
		});
		
		document.addEventListener('mouseup', function(event) {
			editorCamera.cameraStartPos = editorCamera.cameraPos;
			editorCamera.mouseDown = false;
		});
	}

	
	this.getScaledRadius = function(radius) {
		return Math.exp(radius) - Math.exp(this.startExp) + this.startRadius
	}
	
	this.zoomCamera = function() {
		this.camera.position.normalize().multiplyScalar(this.getScaledRadius(this.radius));
	}
	
	this.rotateCamera = function() {
		this.camera.position.y = -this.cameraPos.y;
		this.camera.position.x = Math.sin(this.cameraPos.x);
		this.camera.position.z = Math.cos(this.cameraPos.x);
		
		this.zoomCamera();
		
		this.camera.lookAt(new THREE.Vector3(0, 0, 0));
		
		this.camera.position.add(this.originObject.position);
	}
	
	addEventListeners();
	this.rotateCamera();
}

SS.util.addResizeListener = function() {
	window.addEventListener('resize', function() {
		renderer.setSize(window.innerWidth, window.innerHeight);
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
	});
}

SS.util.computeGeometry = function(geometry) {
	geometry.makeGroups();
	geometry.computeVertexNormals()
	geometry.computeFaceNormals();
	geometry.computeMorphNormals();
	geometry.computeBoundingSphere();
	geometry.computeBoundingBox();
	geometry.computeLineDistances();
	
	geometry.verticesNeedUpdate = true;
	geometry.elementsNeedUpdate = true;
	geometry.uvsNeedUpdate = true;
	geometry.normalsNeedUpdate = true;
	geometry.tangentsNeedUpdate = true;
	geometry.colorsNeedUpdate = true;
	geometry.lineDistancesNeedUpdate = true;
	geometry.buffersNeedUpdate = true;
	geometry.groupsNeedUpdate = true;
}

SS.util.trilinearInterpolation = function(coordFloat, scalarField, interpolation) {
	interpolation = interpolation || function(a, b, x) {
		return  a*(1-x) + b*x;
	}	

	var coord0 = {x: Math.floor(coordFloat.x), y: Math.floor(coordFloat.y), z: Math.floor(coordFloat.z)};
	var coord1 = {x: coord0.x+1, y: coord0.y+1, z: coord0.z+1};
	var xd = (coordFloat.x - coord0.x)/Math.max(1, (coord1.x-coord0.x));
	var yd = (coordFloat.y - coord0.y)/Math.max(1, (coord1.y-coord0.y));
	var zd = (coordFloat.z - coord0.z)/Math.max(1, (coord1.z-coord0.z));
	var c00 = interpolation(scalarField(coord0.x, coord0.y, coord0.z), scalarField(coord1.x, coord0.y, coord0.z), xd);
	var c10 = interpolation(scalarField(coord0.x, coord1.y, coord0.z), scalarField(coord1.x, coord1.y, coord0.z), xd);
	var c01 = interpolation(scalarField(coord0.x, coord0.y, coord1.z), scalarField(coord1.x, coord0.y, coord1.z), xd);
	var c11 = interpolation(scalarField(coord0.x, coord1.y, coord1.z), scalarField(coord1.x, coord1.y, coord1.z), xd);
	var c0 = interpolation(c00, c10, yd);
	var c1 = interpolation(c01, c11, yd);
	var c = interpolation(c0, c1, zd);
	
	return c;
}

SS.util.nearestNeighbour = function(coordFloat, scalarField) {
	return scalarField(Math.floor(coordFloat.x), Math.floor(coordFloat.y), Math.floor(coordFloat.z));
}

SS.util.tricosineInterpolation = function(coordFloat, scalarField) {
	var interpolation = function(a, b, x) {
		var ft = x * 3.1415927;
		var f = (1 - Math.cos(ft)) * 0.5;
		return  a*(1-f) + b*f
	}
	
	return SS.util.trilinearInterpolation(coordFloat, scalarField, interpolation);
}

SS.util.heightToNormalMap = function(map, intensity) {
    var width = map.image.width;
	var height = map.image.height;
	var nofPixels = width*height;
    
    intensity = intensity || 1.0;
    
    var getHeight = function(x, y) {
        x = Math.min(x, width-1);
        y = Math.min(y, height-1);
        return (
            map.image.data[(y*width+x)*3+0]/255 + 
            map.image.data[(y*width+x)*3+1]/255 +
            map.image.data[(y*width+x)*3+2]/255
        )/3*intensity;
    }
    
    var normalMap = THREE.ImageUtils.generateDataTexture(width, height, new THREE.Color(0x000000));

	for (var i = 0; i < nofPixels; i++) {		
		var x = i%width;
		var y = Math.floor(i/width);
		
        var pixel00 = new THREE.Vector3(0, 0, getHeight(x, y));
        var pixel01 = new THREE.Vector3(0, 1, getHeight(x, y+1));
        var pixel10 = new THREE.Vector3(1, 0, getHeight(x+1, y));
        var orto = pixel10.clone().sub(pixel00).cross(pixel01.clone().sub(pixel00)).normalize();
        
		var color = new THREE.Color(orto.x+0.5, orto.y+0.5, -orto.z);
        
        normalMap.image.data[i*3+0] = color.r*255;
		normalMap.image.data[i*3+1] = color.g*255;
		normalMap.image.data[i*3+2] = color.b*255;
    }
    
    return normalMap;
}