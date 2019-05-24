var utils = require("../utils");
var CONST_SEPARATOR_ID = require("../constant").CONST_SEPARATOR_ID;

function mayMatch(fnct, fnctInvocation, result) {
	if (fnct.parts.length !== 2) {
		return false;
	}

	if (fnct.parts[1].value && typeof fnct.parts[1].value === "string") {
                if (fnct.parts[1].value !== "open") {
                        return false;
                }
        }

	return true;
}

function getMatch(fnct, fnctInvocation, result) {
	var endpoints = [];

	// XHR Native API
	if (fnct.parts && fnct.parts.length == 2 &&
			fnct.parts[0].name === "XMLHttpRequest" &&
			fnct.parts[1].value === "open") {
		
		let possibleValue = utils.postProcessingResolveArgument([fnctInvocation.arguments[1]], result);

		for (let j=0; j<possibleValue.length; j++) {
			endpoints.push(possibleValue[j][0]);
		}
	}

	return endpoints;
}

module.exports = {
	mayMatch : mayMatch,
	getMatch : getMatch
}
