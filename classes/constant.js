/// class Constant

function Constant(value) {
	this.value = value;
}

Constant.prototype.toHumanValue = function () {
	return this.value;
}

Constant.prototype.equals = function (val) {
	if (val.constructor.name !== "Constant") {
		return false;
	}

	return this.value === val.value;
}

module.exports = Constant;