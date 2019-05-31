var memoryDriver = require('./impl/memory');

var drivers = {
	"memory" : memoryDriver
}

var currentDriver = null;
var driverMethod = {}

function setDriver(name, options) {
	if (!drivers[name]) {
		throw new Error("Unsupported driver.");
	}

	currentDriver = drivers[name](options);

	var keys = Object.keys(driverMethod);

	for (var i=0; i<keys.length; i++) {
		delete driverMethod[keys[i]];
	}

	var keys = Object.keys(currentDriver);

	for (var i=0; i<keys.length; i++) {
		driverMethod[keys[i]] = currentDriver[keys[i]];
	}
}

modules.exports = {
	setDriver : setDriver,
	method : driverMethod
};