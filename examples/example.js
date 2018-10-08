var finder = require('../index');
var fs = require('fs');

var code = fs.readFileSync("code.js");
var endpoints = finder.getEndpoints(code);

for (let i=0; i<endpoints.length; i++) {
	console.log(endpoints[i]);
}