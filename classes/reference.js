/// class Reference

function Reference(name) {
	this.name = name;
}

Reference.prototype.toHumanValue = function () {
	return "@{ref(" + this.name.split("$").pop() + ")}";
}

Reference.prototype.equals = function (val) {
	if (val.constructor.name !== "Reference") {
		return false;
	}

	return this.name === val.name;
}

module.exports = Reference;