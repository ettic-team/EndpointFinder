var acorn = require("acorn");
var fs = require("fs");

/**
 * Constant
 */

var CONST_SEPARATOR_ID = "&&&";

/**
 * Classes to represent the stucture used in the utility.
 */

var AnalysisResult     = require("./classes/analysis-result");
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
 * Analysis function
 */

/**
 * Returns the list of all the variable declaration in the scope of the 
 * "tree" object.
 *
 * @param tree       - AST object
 * @param collectVar - If we collect variable declared with "var".
 * @param collectLet - If we collect variable declared with "let".
 */
function collectVar(tree, _collectVar, collectLet) {
	var variables = [];

	for (let i=0; i<tree.body.length; i++) {
		let statement = tree.body[i];

		if (statement.type === "VariableDeclaration") {
			if (statement.kind === "let" && !collectLet) {
				continue;
			}

			for (let j=0; j<statement.declarations.length; j++) {
				variables.push(statement.declarations[j].id.name);
			}
		} else if (statement.body && statement.type !== "FunctionDeclaration" && _collectVar) {
			variables = variables.concat(collectVar(statement, true, false));
		} else if (statement.type === "FunctionDeclaration" && _collectVar) {
			variables.push(statement.id.name);
		}
	}

	return variables;
}

/**
 * Returns the list of all the function declaration inside the "tree"
 * object. This search stops at one level of function.
 *
 * @param tree - AST object
 */
function collectFunction(tree) {
	var functions = [];

	function handleProperty(tree) {
		if (!tree) return;

		if (typeof tree === "object") {
			if (tree.body) {
				if (tree.type === "FunctionDeclaration" || tree.type === "FunctionExpression") {
					functions.push(tree);
					return;
				}
			}

			functions = functions.concat(collectFunction(tree));
		}
	}

	for (let prop in tree) {
		if (!tree.hasOwnProperty(prop)) continue;

		if (Array.isArray(tree[prop])) {
			for (let j=0; j<tree[prop].length; j++) {
				handleProperty(tree[prop][j]);
			}
		} else {
			handleProperty(tree[prop]);
		}
	}

	return functions;
}

/**
 * Returns the component of a member expression as a flatten array.
 * It also resolves the symbolic value of the component.
 *
 * @param memberExpression - AST of type "MemberExpression"
 * @param context          - Context object
 */
function flattenMemberExpression(memberExpression, context) {
	var result;
	var property = (memberExpression.computed) ? 
			toSymbolic(memberExpression.property, context) : 
			new Constant(memberExpression.property.name);

	if (memberExpression.object.type === "MemberExpression") {
		result = flattenMemberExpression(memberExpression.object, context);
		result.push(property);
	} else {
		result = [toSymbolic(memberExpression.object, context), property];
	}

	return result;
}

/**
 * Returns the resolved symbolic value of the "variableName".
 *
 * @param variableName - Name of the variable.
 * @param context      - Context object.
 */
function resolveReference(variableName, context) {
	let referenceIdentifier = context.scope.get(variableName);

	if (context.result.assignations.has(referenceIdentifier)) {
		return context.result.assignations.get(referenceIdentifier);
	} else {
		if (typeof referenceIdentifier === "undefined") {
			referenceIdentifier = "G" + CONST_SEPARATOR_ID + variableName;
		}
		return new Reference(referenceIdentifier);
	}
}

/**
 * Returns the resolved symbolic value of the "MemberExpression".
 *
 * @param flattenMemberExpression - Array of all the componenent of the MemberExpression.
 * @param context                 - Context object
 */
function resolveMemberExpression(flattenMemberExpression, context) {
	if (flattenMemberExpression[0].constructor.name === "ObjectStructure") {
		let objStructure = flattenMemberExpression[0];
		let keyValue = flattenMemberExpression[1];

		if (keyValue.constructor.name === "Constant" && objStructure.properties.has(keyValue.value)) {
			if (flattenMemberExpression.length > 2) {
				let subsetMemberExpression = [objStructure.properties.get(keyValue.value)].concat(flattenMemberExpression.slice(2))
				return resolveMemberExpression(subsetMemberExpression);
			} else {
				return objStructure.properties.get(keyValue.value);
			}
		}
	}

	return new MemberExpression(flattenMemberExpression);
}

/**
 * Returns the symbolic value of the AST object "tree".
 *
 * @param tree              - AST object
 * @param context           - Context object
 * @param resolveIdentifier - Whether or not identifier value should be ressolved. 
 */
function toSymbolic(tree, context, resolveIdentfier = true) {
	switch (tree.type) {
		case "Literal":
			return new Constant(tree.value);

		case "Identifier":
			if (resolveIdentfier) {
				let result = resolveReference(tree.name, context);
				return result;
			} else {
				if (context.scope.has(tree.name)) {
					let referenceIdentifier = context.scope.get(tree.name);
					return new Reference(referenceIdentifier);
				} else {
					let tmpReference = new Reference("G" + CONST_SEPARATOR_ID + tree.name);
					context.scope.set(tree.name, tmpReference.name);
					return tmpReference;
				}
			}

		case "BinaryExpression":
			if (tree.operator === "+") {
				return new Concatenation(toSymbolic(tree.left, context), toSymbolic(tree.right, context));
			}
			break;

		case "MemberExpression":
			let memberExpression = flattenMemberExpression(tree, context);

			if (resolveIdentfier) {
				return resolveMemberExpression(memberExpression, context);
			}

			return new MemberExpression(memberExpression);

		case "NewExpression":
			let args = [];
			for (let i=0; i<tree.arguments.length; i++) {
				args.push(toSymbolic(tree.arguments[i], context));	
			}

			if (tree.callee.type === "Identifier") {
				let functionName = tree.callee.name;

				if (context.scope.has(functionName)) {
					return new LocalFunctionCall(context.scope.get(functionName), args);
				} else {
					return new GlobalFunctionCall(functionName, args);
				}
			}

			if (tree.callee.type === "MemberExpression") {
				let members = flattenMemberExpression(tree.callee);
				return new ObjectFunctionCall(members, args);
			}
			break;

		case "ObjectExpression":
			let obj = new ObjectStructure();
			for (let i=0; i<tree.properties.length; i++) {
				let property = tree.properties[i];

				if (property.key.type === "Constant" || property.key.type === "Literal") {
					obj.properties.set(property.key.value, toSymbolic(property.value, context));
				} else {
					obj.properties.set(property.key.name, toSymbolic(property.value, context));
				}
			}
			return obj;

		case "CallExpression":
			let invocation = new FunctionInvocation();
			invocation.fnct = toSymbolic(tree.callee, context);
			invocation.arguments = [];

			for (let j=0; j<tree.arguments.length; j++) {
				invocation.arguments.push(toSymbolic(tree.arguments[j], context));
			}

			return invocation;
			
	}

	return new Unknown();
}

/**
 * Perform a symbolic assignation on a MemberExpression.
 * 
 * @param left         - MemberExpression
 * @param right        - Value to set
 * @param assignations - Map of existing assignations 
 */
function memberExpressionAssignment(left, right, assignations) {
	let mainObj = left.parts[0];
	let prop    = left.parts[1];

	if (mainObj instanceof ObjectStructure && prop instanceof Constant) {
		// For deep structure we need to do the a recursive assignation.
		if (mainObj.properties.has(prop.value) && left.parts.length > 2) {
			let subsetMemberExpression = [mainObj.properties.get(prop.value)].concat(left.parts.slice(2));
			memberExpressionAssignment(subsetMemberExpression, right, assignations);
		} else {
			mainObj.properties.set(prop.value, right);
		}
	} else {
		let found = false;

		assignations.forEach(function (value, key, map) {
			if (found) return;

			if (key instanceof MemberExpression && key.equals(left)) {
				assignations.delete(key);
				assignations.set(left, right);
				found = true;
			}
		});

		if (!found) {
			assignations.set(left, right);
		}
	}
}

/**
 * Merge the content of two AnalysisResult.
 */
function mergeResult(result1, result2) {
	result2.assignations.forEach(function (value, key, map) {
		result1.assignations.set(key, value); 
	});
}

/**
 * Perform the main analysis to retrieve :
 *  - The list of all the function call.
 *  - The list of all the variable and their symbolic value.
 */
function analysis(tree, result = new AnalysisResult(), scope = new Map(), scopeName = "G" + CONST_SEPARATOR_ID, partialScope = false) {
	if (!tree.body) {
		return new Map();
	}

	if (tree.body && !Array.isArray(tree.body)) {
		tree.body = [tree.body];
	}

	var newScope = new Map(scope);
	var listVar  = collectVar(tree, !partialScope, true);

	for (let i=0; i<listVar.length; i++) {
		let variableName = listVar[i];
		newScope.set(variableName, scopeName + variableName);
	}

	if (tree.type === "FunctionDeclaration" || tree.type === "FunctionExpression") {
		for (let i = 0; i < tree.params.length; i++) {
			let arg = tree.params[i];

			if (arg.type === "Identifier") {
				newScope.set(arg.name, scopeName + arg.name);
				let fnctReference = "???"; //anonymous function, need to deal with it
				if (tree.id && tree.id.name) {
					fnctReference = scope.get(tree.id.name);
				}
				result.assignations.set(scopeName + arg.name, new FunctionArgument(fnctReference, arg.name, i));
			}
		}
	}

	var context = new Context(newScope, result, scopeName);

	for (let i=0; i<tree.body.length; i++) {
		let element = tree.body[i];

		switch (element.type) {
			case "VariableDeclaration":
				for (let j=0; j<element.declarations.length; j++) {
					let variable = element.declarations[j];
					if (variable.init) {
						result.assignations.set(newScope.get(variable.id.name), toSymbolic(variable.init, context));
					}
				}
				break;

			case "ExpressionStatement":
				switch(element.expression.type) {
					case "AssignmentExpression":
						let symbolicLeft = toSymbolic(element.expression.left, context, false);
						let symbolicRight = toSymbolic(element.expression.right, context);

						if (symbolicLeft instanceof Reference) {
							result.assignations.set(symbolicLeft.name, symbolicRight);
						} else if (symbolicLeft instanceof MemberExpression) {
							memberExpressionAssignment(symbolicLeft, symbolicRight, result.assignations);
						} else {
							result.assignations.set(symbolicLeft, symbolicRight);
						}
						break;

					case "CallExpression":
						let invocation = toSymbolic(element.expression, context);
						result.invocations.push(invocation);
						break;
				}
				break;

			case "FunctionDeclaration":
			case "FunctionExpression":
				break;

			default:
				if (element.body) {
					let resultFunction = analysis(element, result, newScope, scopeName + "LS" + i + CONST_SEPARATOR_ID, true);
					mergeResult(result, resultFunction);
				}
				break;
		}
	}

	if (!partialScope) {
		let functions = collectFunction(tree);

		for (let i=0; i<functions.length; i++) {
			let element = functions[i];
			let resultFunction = analysis(element, result, newScope, scopeName + "FS" + i + CONST_SEPARATOR_ID, false);

			mergeResult(result, resultFunction);
		}

	}

	return result;
}

/**
 * Returns the list of all "FunctionArgument" used in the symbolic value of "args."
 */
function postProcessingGatherArgument(args) {
	var output = [];

	for (let i=0; i<args.length; i++) {
		let arg = args[i];

		switch (arg.constructor.name) {
			case "Concatenation":
				output = output.concat(postProcessingGatherArgument([arg.values[0]]));
				output = output.concat(postProcessingGatherArgument([arg.values[1]]));
				break;

			case "FunctionArgument":
				output.push(arg);
				break;
		}
	}

	return output;
}

/**
 * Returns the value of an "arg" given the resolved value of the function argument.
 */
function postProcessingResolveArgumentWithValue(arg, result, functionArgsPosition, resolvedFunctionArgs) {
	switch (arg.constructor.name) {
		case "Constant":
			return arg.value;

		case "ObjectStructure":
			let obj = {};
			arg.properties.forEach(function (value, key, map) {
				obj[key] = postProcessingResolveArgumentWithValue(value, result, functionArgsPosition, resolvedFunctionArgs);
			});
			return obj;

		case "Concatenation":
			let leftSide = postProcessingResolveArgumentWithValue(arg.values[0], result, functionArgsPosition, resolvedFunctionArgs);
			let rightSide = postProcessingResolveArgumentWithValue(arg.values[1], result, functionArgsPosition, resolvedFunctionArgs);
			return leftSide + rightSide;

		case "FunctionArgument":
			let positionArg = functionArgsPosition.indexOf(arg.position);
			return resolvedFunctionArgs[positionArg];
	}

	return "@{VAR}";
}

/**
 * Returns the list of all possible value an "arg" value can hold.
 */
function postProcessingResolveArgument(arg, result) {
	var functionArgs = postProcessingGatherArgument(arg);
	var functionArgsPosition = [];
	var resolvedFunctionArgs = [];
	var output = [];

	if (functionArgs.length > 0) {
		for (let i=0; i<result.invocations.length; i++) {
			let invocation = result.invocations[i];

			if (invocation.fnct.constructor.name === "Reference" && invocation.fnct.name === functionArgs[0].fnct) {
				let toResolve = functionArgs.map(function (arg) { return invocation.arguments[arg.position]; });
				let res = postProcessingResolveArgument(toResolve, result);
				
				functionArgsPosition = functionArgs.map(function (arg) { return arg.position; });
				resolvedFunctionArgs = resolvedFunctionArgs.concat(res);
			}
		}

		for (let i=0; i<resolvedFunctionArgs.length; i++) {
			let res = [];

			for (let j=0; j<arg.length; j++) {
				res.push(postProcessingResolveArgumentWithValue(arg[j], result, functionArgsPosition, resolvedFunctionArgs[i]))
			}

			output.push(res);
		}
	} else {
		let res = [];

		for (let j=0; j<arg.length; j++) {
			res.push(postProcessingResolveArgumentWithValue(arg[j], result, [], []));
		}

		output.push(res);
	}

	return output;
}

function getEndpoints(code) {
	// Main code to test the analysis function
	var tree = acorn.parse(code);
	var result = analysis(tree);
	var endpoints = [];

	for (let i=0; i<result.invocations.length; i++) {
		let fnctInvocation = result.invocations[i];

		// XHR Native API 
		if (fnctInvocation.fnct.parts && 
				fnctInvocation.fnct.parts[0].name === "XMLHttpRequest" &&
				fnctInvocation.fnct.parts[1].value === "open") {

			let possibleValue = postProcessingResolveArgument([fnctInvocation.arguments[1]], result);

			for (let j=0; j<possibleValue.length; j++) {
				endpoints.push(possibleValue[j][0]);
			}
		}

		// jQuery API : $_.get
		if (fnctInvocation.fnct.parts &&
				(fnctInvocation.fnct.parts[0].name || "").endsWith(CONST_SEPARATOR_ID + "$") &&
				fnctInvocation.fnct.parts[1].value === "get") {

			let possibleValue = postProcessingResolveArgument([fnctInvocation.arguments[0]], result);

			for (let j=0; j<possibleValue.length; j++) {
				// $.get("/path", { ... settings ... })
				if (typeof possibleValue[j][0] === "string") {
					endpoints.push(possibleValue[j][0]);

				// $.get({ url : "/path", ... settings ... })
				} else {
					endpoints.push(possibleValue[j][0].url);
				}
			}	
		}

		// jQuery API : $_.post
		if (fnctInvocation.fnct.parts &&
				(fnctInvocation.fnct.parts[0].name || "").endsWith(CONST_SEPARATOR_ID + "$") &&
				fnctInvocation.fnct.parts[1].value === "post") {

			let possibleValue = postProcessingResolveArgument([fnctInvocation.arguments[0]], result);

			for (let j=0; j<possibleValue.length; j++) {
				// $.post("/path", { ... settings ... })
				if (typeof possibleValue[j][0] === "string") {
					endpoints.push(possibleValue[j][0]);

				// $.post({ url : "/path", ... settings ... })
				} else {
					endpoints.push(possibleValue[j][0].url);
				}
			}	
		}

		// jQuery API : $_.ajax
		if (fnctInvocation.fnct.parts &&
				(fnctInvocation.fnct.parts[0].name || "").endsWith(CONST_SEPARATOR_ID + "$") &&
				fnctInvocation.fnct.parts[1].value === "ajax") {

			let possibleValue = postProcessingResolveArgument([fnctInvocation.arguments[0]], result);

			for (let j=0; j<possibleValue.length; j++) {
				// $.ajax("/path", { ... settings ... })
				if (typeof possibleValue[j][0] === "string") {
					endpoints.push(possibleValue[j][0]);

				// $.ajax({ url : "/path", ... settings ... })
				} else {
					endpoints.push(possibleValue[j][0].url);
				}
			}	
		}
	}

	return endpoints;
}

module.exports = {
	getEndpoints : getEndpoints
}

