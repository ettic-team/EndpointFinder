/// class GlobalFunctionCall

function GlobalFunctionCall(name, args) {
	this.name = name;
	this.arguments = args;
}

GlobalFunctionCall.prototype.toHumanValue = function () {
	var result = this.name + "(";
	for (let i=0; i<this.arguments.length; i++) {
		result += this.arguments[i].toHumanValue();
		if (i !== this.arguments.length - 1) {
			result += ",";
		}
	}
	result += ")";
	return result;
}

GlobalFunctionCall.prototype.equals = function (val) {
	if (val.constructor.name !== "GlobalFunctionCall") {
		return false;
	}

	if (this.name !== val.name) {
		return false;
	} 

	if (this.arguments.length !== val.arguments.length) {
		return false;
	}

	var good = true;

	this.arguments.forEach(function (value, index) {
		if (!value.equals(val.arguments[index])) {
			good = false;
		}
	});

	return good;
}

module.exports = GlobalFunctionCall;