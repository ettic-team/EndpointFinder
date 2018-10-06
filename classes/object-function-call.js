/// class ObjectFunctionCall

function ObjectFunctionCall(members, args) {
	this.members = new MemberExpression(members);
	this.arguments = args;
}

ObjectFunctionCall.prototype.toHumanValue = function () {
	//TODO
};

ObjectFunctionCall.prototype.equals = function (val) {
	if (val.constructor.name !== "ObjectFunctionCall") {
		return false;
	}

	if (!this.members.equals(val.members)) {
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
};

module.exports = ObjectFunctionCall;