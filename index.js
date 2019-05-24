var acorn = require("acorn");
var utils = require("./utils");

/**
 * Constant
 */

var CONST_SEPARATOR_ID = require("./constant").CONST_SEPARATOR_ID;
var PLACEHOLDER_VARIABLE = require("./constant").PLACEHOLDER_VARIABLE;

/**
 * Classes to represent the stucture used in the utility.
 */

var AnalysisResult     = require("./classes/analysis-result");
var ArrayStructure     = require("./classes/array-structure");
var Concatenation      = require("./classes/concatenation");
var Constant           = require("./classes/constant");
var Context            = require("./classes/context");
var FunctionArgument   = require("./classes/function-argument");
var FunctionInvocation = require("./classes/function-invocation");
var GlobalFunctionCall = require("./classes/global-function-call");
var LocalFunctionCall  = require("./classes/local-function-call");
var MemberExpression   = require("./classes/member-expression");
var ObjectFunctionCall = require("./classes/object-function-call");
var ObjectStructure    = require("./classes/object-structure");
var Reference          = require("./classes/reference");
var Unknown            = require("./classes/unknown");

/**
 * Matchers
 */

var NativeMatcher = require("./matchers/native-matcher");
var JQueryMatcher = require("./matchers/jquery-matcher");
var AngularMatcher = require("./matchers/angular-matcher");

var MATCHERS = [NativeMatcher, JQueryMatcher, AngularMatcher];

/**
 * Main function of the project. This results an array of endpoint that are invoked
 * by the JavaScript code that supplied as the first argument.
 * 
 * @param code - String value of the JavaScript
 */
function getEndpoints(code) {
	// Main code to test the analysis function
	var tree = acorn.parse(code);
	var result = utils.analysis(tree);
	var endpoints = [];

	for (let i=0; i<result.invocations.length; i++) {
		let fnctInvocation = result.invocations[i];
		let fnct = fnctInvocation.fnct;

		// Normalize so that all function call are handled as MemberExpression
		// Some of the proprocessing will modify this parts to resolve some element.
		// We make sure to have a cloned copy to avoid modifying the returned data.
		if (!(fnct instanceof MemberExpression)) {
			fnct = new MemberExpression([fnct]);
		} else {
			fnct = new MemberExpression(fnct.parts);
		}

		// Check if the function invocation could match something.
		// This discards function invocation that we are sure won't match anything.
		let couldMatch = false;

		for (let j=0; j<MATCHERS.length; j++) {
			couldMatch |= MATCHERS[j].mayMatch(fnct, fnctInvocation, result);
		}

		if (!couldMatch) {
			continue;
		}

		// Pre-processing to resolve the function called.
		// This is to handle cases where $, XMLHttpRequest or $http is passed as an argument.
		for (let j=0; j<fnct.parts.length; j++) {
			let memberPart = fnct.parts[j];

			let possibleValue = utils.postProcessingResolveArgument([memberPart], result, false);

			if (possibleValue.length !== 1) {
				continue;
			}

			if (typeof possibleValue[0][0].output !== "string") {
				fnct.parts[j] = possibleValue[0][0].output;
			}
		}
		
		for (let j=0; j<MATCHERS.length; j++) {
			endpoints = endpoints.concat(MATCHERS[j].getMatch(fnct, fnctInvocation, result));
		}
	}


	return endpoints;
}

module.exports = {
	getEndpoints : getEndpoints
}
