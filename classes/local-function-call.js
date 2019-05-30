/// class LocalFunctionCall

function LocalFunctionCall(reference, args) {
	if (reference == null) {
		throw new Exception("Reference is null.");
	}

	if (typeof args !== "object" || typeof args.length !== "number") {
                throw new Error("Type of args must be array.");
        }

	this.arguments = args;
	this.reference = reference;
}

LocalFunctionCall.prototype.toHumanValue = function () {
	var result = this.reference.toHumanValue() + "(";
	for (let i=0; i<this.arguments.length; i++) {
		result += this.arguments[i].toHumanValue() + ",";
	}
	result = result.substring(0, result.length - 1) + ")";
	return result;
}

LocalFunctionCall.prototype.equals = function (val) {
	if (val.constructor.name !== "LocalFunctionCall") {
		return false;
	}

	if (this.reference !== val.reference) {
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

module.exports = LocalFunctionCall;
