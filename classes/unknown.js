/// class Unknown

function Unknown() {

}

Unknown.prototype.toHumanValue = function () {
	return "@{UNKNOWN}";
}

Unknown.prototype.equals = function (val) {
	if (val.constructor.name !== "Unknown") {
		return false;
	}

	return true;
}

module.exports = Unknown;