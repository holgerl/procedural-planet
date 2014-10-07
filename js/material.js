window.SS = window.SS || {};
SS.material = SS.material || {};

SS.material.shaderMaterial = function() {
	var vertexShader = "\
		varying vec3 vNormal;\
		varying vec3 cameraVector;\
		varying vec3 vPosition;\
		\
		void main() {\
			vNormal = normal;\
			vec4 vPosition4 = modelMatrix * vec4( position, 1.0 );\
			vPosition = vPosition4.xyz;\
			cameraVector = cameraPosition - vPosition;\
			\
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\
		}\
	";
	
	var fragmentShader = "\
		uniform vec3 pointLightPosition;\
		\
		varying vec3 vNormal;\
		varying vec3 vPosition;\
		varying vec3 cameraVector;\
		\
		void main() {\
			float PI = 3.14159265358979323846264;\
			vec3 light = pointLightPosition - vPosition;\
			vec3 cameraDir = normalize(cameraVector);\
			\
			light = normalize(light);\
			\
			float lightAngle = max(0.0, dot(vNormal, light));\
			float viewAngle = max(0.0, dot(vNormal, cameraDir));\
			float adjustedLightAngle = min(0.6, lightAngle) / 0.6;\
			float adjustedViewAngle = min(0.65, viewAngle) / 0.65;\
			float invertedViewAngle = pow(acos(viewAngle), 3.0) * 0.4;\
			\
			float dProd = 0.0;\
			dProd += 0.5 * lightAngle;\
			dProd += 0.2 * lightAngle * (invertedViewAngle - 0.1);\
			dProd += invertedViewAngle * 0.5 * (max(-0.35, dot(vNormal, light)) + 0.35);\
			dProd *= 0.7 + pow(invertedViewAngle/(PI/2.0), 2.0);\
			\
			gl_FragColor = vec4(dProd, dProd, dProd, dProd/2.0);\
		}\
	";
	
	var uniforms = {
		"pointLightPosition": {"type": "v3", "value": sunLight.position}
	};

	return new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: vertexShader,
		fragmentShader: fragmentShader,
		transparent: true
	});
}