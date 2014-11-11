window.SS = window.SS || {};
SS.material = SS.material || {};

SS.material.shaderMaterial = function(map) {
	var vertexShader = "\
		varying vec3 vNormal;\
		varying vec3 cameraVector;\
		varying vec3 vPosition;\
		varying vec2 vUv;\
		\
		void main() {\
			vNormal = normal;\
			vec4 vPosition4 = modelMatrix * vec4(position, 1.0);\
			vPosition = vPosition4.xyz;\
			cameraVector = cameraPosition - vPosition;\
			vUv = uv;\
			\
			gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\
		}\
	";
	
	var fragmentShader = "\
		uniform vec3 pointLightPosition;\
		uniform sampler2D map;\
		uniform sampler2D normalMap;\
		\
		varying vec3 vNormal;\
		varying vec3 vPosition;\
		varying vec3 cameraVector;\
		varying vec2 vUv;\
        \
        mat4 rotationMatrix(vec3 axis, float angle) {\
            axis = normalize(axis);\
            float s = sin(angle);\
            float c = cos(angle);\
            float oc = 1.0 - c;\
            \
            return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,\
                        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,\
                        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,\
                        0.0,                                0.0,                                0.0,                                1.0);\
        }\
        \
        vec3 bumpNormal(sampler2D normalMap, vec2 vUv) {\
            vec3 bumpedNormal = normalize(texture2D(normalMap, vUv).xyz * 2.0 - 1.0);\
            \
            vec3 y_axis = vec3(0,1,0);\
            float rot_angle = acos(dot(bumpedNormal,y_axis));\
            vec3 rot_axis = normalize(cross(bumpedNormal,y_axis));\
            return vec3(rotationMatrix(rot_axis, rot_angle) * vec4(vNormal, 1.0));\
        }\
        \
		void main() {\
			float PI = 3.14159265358979323846264;\
			vec3 light = pointLightPosition - vPosition;\
			vec3 cameraDir = normalize(cameraVector);\
            vec3 newNormal = bumpNormal(normalMap, vUv);\
			\
			light = normalize(light);\
			\
			float lightAngle = max(0.0, dot(newNormal, light));\
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
			dProd *= 0.5;\
			vec4 atmColor = vec4(dProd, dProd, dProd, 1.0);\
			\
			vec4 texelColor = texture2D(map, vUv) * min(asin(lightAngle), 1.0);\
			gl_FragColor = texelColor + min(atmColor, 0.8);\
		}\
	";
	
	var uniforms = {
		"pointLightPosition": {"type": "v3", "value": sunLight.position},
		"map": {"type": "t", "value": map},
		"normalMap": {"type": "t", "value": SS.util.heightToNormalMap(map)}
	};

	return new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: vertexShader,
		fragmentShader: fragmentShader,
		transparent: true
	});
}