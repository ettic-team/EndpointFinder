/// class Reference

var CONST_SEPARATOR_ID = "&&&";

function Reference(name) {
	if (typeof name !== "string") {
		throw new Error("Type of name must be string.");
	}

	this.name = name;
}

Reference.prototype.toHumanValue = function () {
	return "@{ref(" + this.name.split(CONST_SEPARATOR_ID).pop() + ")}";
}

Reference.prototype.equals = function (val) {
	if (val.constructor.name !== "Reference") {
		return false;
	}

	return this.name === val.name;
}

module.exports = Reference;
