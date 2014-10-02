window.SS = window.SS || {};
SS.starbox = SS.starbox || {};
	
var maxDetail = SS.lowgraphics ? 16 : 512; //256 = 11 seconds (before), 512 = 5 seconds (now)

SS.starbox.StarBox = function(radius) {
	THREE.Object3D.call(this);
	
	var sphere = new SS.spheremap.Sphere(
		SS.starbox.starboxcalarField, 
		radius, 
		function() {return new THREE.MeshBasicMaterial({side: THREE.BackSide, depthWrite: false});},
		maxDetail,
		false
	);
	
	this.add(sphere);
}
SS.starbox.StarBox.prototype = Object.create(THREE.Object3D.prototype);

SS.starbox.starboxcalarField = function(x, y, z) {
	var starResolution = maxDetail;
	var starDensity = 1/1000;
	
	var coordFloat = new THREE.Vector3();
	
	var starScalarField = function(x, y, z) {
		var rand = SS.util.random4(Math.abs(x), Math.abs(y), Math.abs(z));
		return rand < starDensity ? rand/starDensity*(1-0.25) : 0;
	}
	
	var helper = function(x, y, z, scalarField, resolution, interpolationMethod) {
		// Because the sphere sample function gives normalized coordinates:
		x = (x+1)/2*resolution;
		y = (y+1)/2*resolution;
		z = (z+1)/2*resolution;
		
		coordFloat.set(x, y, z);
		
		return interpolationMethod(coordFloat, scalarField);
	}
	
	var c = helper(x, y, z, starScalarField, starResolution, SS.util.nearestNeighbour);
	
	c = SS.util.clamp(c, 0, 1);
	
	return new THREE.Color().setRGB(c, c, c);
}