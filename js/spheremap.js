window.SS = window.SS || {};
SS.spheremap = SS.spheremap || {};

SS.spheremap.Sphere = function(scalarField, radius, materialCallback, resolution) {
	THREE.Object3D.call(this);
	
	radius = radius || 1;
	materialCallback = materialCallback || function() {return new THREE.MeshPhongMaterial()};
	resolution = resolution || 128;
	
	var geometry = new THREE.BoxGeometry(1, 1, 1, 64, 64, 64);
	
	for (var i in geometry.vertices) {
		var vertex = geometry.vertices[i];
		vertex.normalize().multiplyScalar(radius);
	}
	
	SS.util.computeGeometry(geometry);
	
	var computeVertexNormals = function(geometry) {
		for (var f = 0; f < geometry.faces.length; f++) {
			var face = geometry.faces[f];
			face.vertexNormals[0] = geometry.vertices[face.a].clone().normalize();
			face.vertexNormals[1] = geometry.vertices[face.b].clone().normalize();
			face.vertexNormals[2] = geometry.vertices[face.c].clone().normalize();
		}
	}
	
	computeVertexNormals(geometry); // TODO: Why is this neccessary? (Why does geometry.computeVertexNormals not work correctly?)
	
	var materialArray = [];
	for (var i = 0; i < 6; i++) {
        var map = SS.spheremap.createMap(i, scalarField, resolution);
		var faceMaterial = materialCallback(map);
		materialArray.push(faceMaterial);
	}
		
	var sphereMaterial = new THREE.MeshFaceMaterial(materialArray);
	var sphere = new THREE.Mesh(geometry, sphereMaterial);
	
	this.add(sphere);
}
SS.spheremap.Sphere.prototype = Object.create(THREE.Object3D.prototype);

SS.spheremap.createMap = function(index, scalarField, resolution) {
	var map = THREE.ImageUtils.generateDataTexture(resolution, resolution, new THREE.Color(0x000000));
	addScalarField(map, index, scalarField);
	map.needsUpdate = true;
	return map;
}

var addScalarField = function(map, index, scalarField) {
	var width = map.image.width;
	var height = map.image.height;
	var nofPixels = width*height;

	for (var i = 0; i < nofPixels; i++) {		
		var x = i%width;
		var y = Math.floor(i/width);
		var sphericalCoord = getSphericalCoord(index, x, y, width);
		
		var color = scalarField(sphericalCoord.x, sphericalCoord.y, sphericalCoord.z);
		
		map.image.data[i*3] = color.r*255;
		map.image.data[i*3+1] = color.g*255;
		map.image.data[i*3+2] = color.b*255;
	}
}

var getSphericalCoord = function(index, x, y, width) {
	width /= 2;
	x -= width;
	y -= width;
	var coord = new THREE.Vector3();
	
	if (index == 0) {coord.x=width; coord.y=-y, coord.z=-x}
	else if (index == 1) {coord.x=-width; coord.y=-y, coord.z=x}
	else if (index == 2) {coord.x=x; coord.y=width, coord.z=y}
	else if (index == 3) {coord.x=x; coord.y=-width, coord.z=-y}
	else if (index == 4) {coord.x=x; coord.y=-y, coord.z=width}
	else if (index == 5) {coord.x=-x; coord.y=-y, coord.z=-width}
	
	coord.normalize();
	return coord;
}