/// class ObjectStructure

function ObjectStructure(type) {
	if (typeof type === "undefined" || type === null) {
		type = "G$Object";
	}
	
	this.properties = new Map();
	this.type = type;
}

ObjectStructure.prototype.toHumanValue = function () {
	return "@{obj(" + this.type + ")}";
};

ObjectStructure.prototype.equals = function (val) {
	if (val.constructor.name !== "ObjectStructure") {
		return false;
	}

	if (val.properties.size !== this.properties.size || val.type !== this.type) {
		return false;
	}

	var good = true;

	this.properties.forEach(function (value, key, map) {
		if (!val.properties.has(key)) {
			good = false;
			return;
		}

		if (!val.properties.get(key).equals(value)) {
			good = false;
			return;
		}
	});

	return good;
};

module.exports = ObjectStructure;