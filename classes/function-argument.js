/// class FunctionArgument

function FunctionArgument(fnct, variableName, position) {
	this.name = variableName;
	this.fnct = fnct;
	this.position = position;
}

FunctionArgument.prototype.toHumanValue = function () {
	return "@{arg" + this.position + "(" + this.name + ")}";
}

FunctionArgument.prototype.equals = function (val) {
	if (val.constructor.name !== "FunctionArgument") {
		return false;
	}

	if (this.name !== val.name) {
		return false;
	}

	
	if (typeof this.fnct === "string") {
		if (val.fnct !== this.fnct) {
			return false;
		}	
	} else if (!this.fnct.equals(val.fnct)) {
		return false;
	}

	if (this.position !== val.position) {
		return false;
	}

	return true;
}

module.exports = FunctionArgument;
