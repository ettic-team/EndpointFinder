/// class FunctionInvocation

function FunctionInvocation() {
	this.fnct = null;
	this.arguments = [];
}

FunctionInvocation.prototype.equals = function (val) {
	if (val.constructor.name !== "FunctionInvocation") {
		return false;
	}

	if (!this.fnct.equals(val.fnct)) {
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

module.exports = FunctionInvocation;
