var utils = require("../utils");
var CONST_SEPARATOR_ID = require("../constant").CONST_SEPARATOR_ID;

function mayMatch(fnct, fnctInvocation, result) {
	if (fnct.parts.length !== 2) {
                return false;
        }

        if (fnct.parts[1].value && typeof fnct.parts[1].value === "string") {
                if (fnct.parts[1].value !== "get" && fnct.parts[1].value !== "post" && fnct.parts[1].value !== "ajax" && fnct.parts[1].value !== "getJSON") {
                        return false;
                }
        }

        return true;
}

function getMatch(fnct, fnctInvocation, result) {
	var endpoints = [];

	// jQuery API : $.get
	if (fnct.parts && fnct.parts.length == 2 &&
			(fnct.parts[0].name || "").endsWith(CONST_SEPARATOR_ID + "$") &&
			fnct.parts[1].value === "get") {

		let possibleValue = utils.postProcessingResolveArgument([fnctInvocation.arguments[0]], result);

		for (let j=0; j<possibleValue.length; j++) {
			// $.get("/path", { ... settings ... })
			if (typeof possibleValue[j][0].output === "string") {
				endpoints.push(possibleValue[j][0]);

			// $.get({ url : "/path", ... settings ... })
			} else {
				endpoints.push({ output: possibleValue[j][0].output.url, unknownPosition : possibleValue[j][0].unknownPosition.url } );
			}
		}	
	}

	// jQuery API : $.post
	if (fnct.parts && fnct.parts.length == 2 &&
			(fnct.parts[0].name || "").endsWith(CONST_SEPARATOR_ID + "$") &&
			fnct.parts[1].value === "post") {

		let possibleValue = utils.postProcessingResolveArgument([fnctInvocation.arguments[0]], result);

		for (let j=0; j<possibleValue.length; j++) {
			// $.post("/path", { ... settings ... })
			if (typeof possibleValue[j][0].output === "string") {
				endpoints.push(possibleValue[j][0]);

			// $.post({ url : "/path", ... settings ... })
			} else {
				endpoints.push({ output: possibleValue[j][0].output.url, unknownPosition : possibleValue[j][0].unknownPosition.url } );
			}
		}	
	}

	// jQuery API : $.ajax
	if (fnct.parts && fnct.parts.length == 2 &&
			(fnct.parts[0].name || "").endsWith(CONST_SEPARATOR_ID + "$") &&
			fnct.parts[1].value === "ajax") {

		let possibleValue = utils.postProcessingResolveArgument([fnctInvocation.arguments[0]], result);

		for (let j=0; j<possibleValue.length; j++) {
			// $.ajax("/path", { ... settings ... })
			if (typeof possibleValue[j][0].output === "string") {
				endpoints.push(possibleValue[j][0]);

			// $.ajax({ url : "/path", ... settings ... })
			} else {
				endpoints.push({ output: possibleValue[j][0].output.url, unknownPosition : possibleValue[j][0].unknownPosition.url } );
			}
		}	
	}

	// jQuery API : $.getJSON
	if (fnct.parts && fnct.parts.length == 2 &&
			(fnct.parts[0].name || "").endsWith(CONST_SEPARATOR_ID + "$") &&
			fnct.parts[1].value === "getJSON") {

		let possibleValue = utils.postProcessingResolveArgument([fnctInvocation.arguments[0]], result);

		for (let j=0; j<possibleValue.length; j++) {
			// $.getJSON("/path", ...)
			endpoints.push(possibleValue[j][0]);
		}	
	}

	return endpoints;
}

module.exports = {
	mayMatch : mayMatch,
	getMatch : getMatch
}
