var utils = require("../utils");
var CONST_SEPARATOR_ID = require("../constant").CONST_SEPARATOR_ID;

function mayMatch(fnct, fnctInvocation, result) {
        if (fnct.parts.length !== 2) {
                return false;
        }

        if (fnct.parts[1].value && typeof fnct.parts[1].value === "string") {
                if (fnct.parts[1].value !== "get" && 
			fnct.parts[1].value !== "post" && 
			fnct.parts[1].value !== "delete" && 
			fnct.parts[1].value !== "patch" && 
			fnct.parts[1].value !== "put" &&
			fnct.parts[1].value !== "head" && 
			fnct.parts[1].value !== "jsonp") {
                        
			return false;
                }
        }

        return true;	
}

function getMatch(fnct, fnctInvocation, result) {
	var endpoints = [];

	// AngularJS $http.get
	if (fnct.parts && fnct.parts.length == 2 &&
			(fnct.parts[0].name === ("G" + CONST_SEPARATOR_ID + "$http") || 
			 fnct.parts[0].name === ("G" + CONST_SEPARATOR_ID + "http"))  &&
			fnct.parts[1].value === "get") {

		let possibleValue = utils.postProcessingResolveArgument([fnctInvocation.arguments[0]], result);

		for (let j=0; j<possibleValue.length; j++) {
			endpoints.push(possibleValue[j][0]);
		}	
	}

	// AngularJS $http.post
	if (fnct.parts && fnct.parts.length == 2 &&
			(fnct.parts[0].name === ("G" + CONST_SEPARATOR_ID + "$http") || 
			 fnct.parts[0].name === ("G" + CONST_SEPARATOR_ID + "http"))  &&
			fnct.parts[1].value === "post") {

		let possibleValue = utils.postProcessingResolveArgument([fnctInvocation.arguments[0]], result);

		for (let j=0; j<possibleValue.length; j++) {
			endpoints.push(possibleValue[j][0]);
		}	
	}

	// AngularJS $http.delete
	if (fnct.parts && fnct.parts.length == 2 &&
			(fnct.parts[0].name === ("G" + CONST_SEPARATOR_ID + "$http") || 
			 fnct.parts[0].name === ("G" + CONST_SEPARATOR_ID + "http"))  &&
			fnct.parts[1].value === "delete") {

		let possibleValue = utils.postProcessingResolveArgument([fnctInvocation.arguments[0]], result);

		for (let j=0; j<possibleValue.length; j++) {
			endpoints.push(possibleValue[j][0]);
		}	
	}

	// AngularJS $http.patch
	if (fnct.parts && fnct.parts.length == 2 &&
			(fnct.parts[0].name === ("G" + CONST_SEPARATOR_ID + "$http") || 
			 fnct.parts[0].name === ("G" + CONST_SEPARATOR_ID + "http"))  &&
			fnct.parts[1].value === "patch") {

		let possibleValue = utils.postProcessingResolveArgument([fnctInvocation.arguments[0]], result);

		for (let j=0; j<possibleValue.length; j++) {
			endpoints.push(possibleValue[j][0]);
		}	
	}

	// AngularJS $http.put
	if (fnct.parts && fnct.parts.length == 2 &&
			(fnct.parts[0].name === ("G" + CONST_SEPARATOR_ID + "$http") || 
			 fnct.parts[0].name === ("G" + CONST_SEPARATOR_ID + "http"))  &&
			fnct.parts[1].value === "put") {

		let possibleValue = utils.postProcessingResolveArgument([fnctInvocation.arguments[0]], result);

		for (let j=0; j<possibleValue.length; j++) {
			endpoints.push(possibleValue[j][0]);
		}	
	}

	// AngularJS $http.head
	if (fnct.parts && fnct.parts.length == 2 &&
			(fnct.parts[0].name === ("G" + CONST_SEPARATOR_ID + "$http") || 
			 fnct.parts[0].name === ("G" + CONST_SEPARATOR_ID + "http"))  &&
			fnct.parts[1].value === "head") {

		let possibleValue = utils.postProcessingResolveArgument([fnctInvocation.arguments[0]], result);

		for (let j=0; j<possibleValue.length; j++) {
			endpoints.push(possibleValue[j][0]);
		}	
	}

	// AngularJS $http.jsonp
	if (fnct.parts && fnct.parts.length == 2 &&
			(fnct.parts[0].name === ("G" + CONST_SEPARATOR_ID + "$http") || 
			 fnct.parts[0].name === ("G" + CONST_SEPARATOR_ID + "http"))  &&
			fnct.parts[1].value === "jsonp") {

		let possibleValue = utils.postProcessingResolveArgument([fnctInvocation.arguments[0]], result);

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
