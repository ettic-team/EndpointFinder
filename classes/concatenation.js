/// class Concatenation

function Concatenation(value1, value2) {
	this.values = [];
	this.values.push(value1);
	this.values.push(value2);
}

Concatenation.prototype.toHumanValue = function () {
	var result = "";
	for (let i=0; i<this.values.length; i++) {
		result += this.values[i].toHumanValue();
	}
	return result;
}

Concatenation.prototype.equals = function (val) {
	if (val.constructor.name !== "Concatenation") {
		return false;
	}

	return val.values[0].equals(this.values[0]) && val.values[1].equals(this.values[1]);
}

module.exports = Concatenation;