var memoryDriver = require('./impl/memory');

var drivers = {
	"memory" : memoryDriver.getInstance
}

var driverMethod = {}

function getInstance(name, options) {
	if (!drivers[name]) {
		throw new Error("Unsupported driver.");
	}

	return drivers[name](options);
}

modules.exports = {
	getInstance : getInstance
};
