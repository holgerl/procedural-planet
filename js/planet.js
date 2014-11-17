"use strict";

window.SS = window.SS || {};
SS.planet = SS.planet || {};
	
SS.lowgraphics = true;
var maxDetail = SS.lowgraphics ? 16 : 512; //256 = 11 seconds (before), 512 = 5 seconds (now)

SS.planet.Planet = function(planetRadius, textureMaps, bumpMaps) {
	THREE.Object3D.call(this);
	
	var materialArray = [];
	for (var i = 0; i < 6; i++) {
		materialArray.push(SS.material.shaderMaterial(textureMaps[i], bumpMaps[i]));
	}
	
	var sphere = new SS.spheremap.Sphere(planetRadius, materialArray);
	this.add(sphere);
}
SS.planet.Planet.prototype = Object.create(THREE.Object3D.prototype);