var exportFnct = {};

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

function debug(message) {
	if (typeof console === "undefined") {
		if (typeof message !== "string") {
			message = JSON.stringify(message);
		}
		System.println(message + "");
	} else {
		console.log(message);
	}
}

exportFnct.debug = debug;

function clone(obj) {
	return JSON.parse(JSON.stringify(obj));
}

exportFnct.clone = clone;

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

exportFnct.collectVar = collectVar;

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

exportFnct.collectFunction = collectFunction;

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

exportFnct.flattenMemberExpression = flattenMemberExpression;

/**
 * Returns the resolved symbolic value of the "variableName".
 *
 * @param variableName - Name of the variable.
 * @param context      - Context object.
 */
function resolveReference(variableName, context) {
	let referenceIdentifier = context.scope.get(variableName);
	
	if (context.result.assignations.has(referenceIdentifier)) {
		let res = context.result.assignations.get(referenceIdentifier);
		return res;
	} else {
		if (typeof referenceIdentifier === "undefined" || referenceIdentifier === null) {
			referenceIdentifier = "G" + CONST_SEPARATOR_ID + variableName;
		}
		return new Reference(referenceIdentifier);
	}
}

exportFnct.resolveReference = resolveReference;

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

exportFnct.resolveMemberExpression = resolveMemberExpression;

/**
 * Returns the symbolic value of the AST object "tree".
 *
 * @param tree              - AST object
 * @param context           - Context object
 * @param resolveIdentifier - Whether or not identifier value should be ressolved. 
 */
function toSymbolic(tree, context, resolveIdentfier) {
	if (typeof resolveIdentfier === "undefined") {
		resolveIdentfier = true;
	}

	if (!context) {
		throw new Exception("context is null");
	}

	switch (tree.type) {
		case "Literal":
			let constant = new Constant(tree.value);
			constant.position = { start : tree.start, end : tree.end };
			return constant;

		case "Identifier":
			if (resolveIdentfier) {
				let result = resolveReference(tree.name, context);
				if (!result.position) {
					result.position = { start : tree.start, end : tree.end };
				}
				return result;
			} else {
				if (context.scope.has(tree.name)) {
					let referenceIdentifier = context.scope.get(tree.name);
					let ref = new Reference(referenceIdentifier);
					ref.position = { start : tree.start, end : tree.end };
					return ref;
				} else {
					let tmpReference = new Reference("G" + CONST_SEPARATOR_ID + tree.name);
					context.scope.set(tree.name, tmpReference.name);
					tmpReference.position = { start : tree.start, end : tree.end };
					return tmpReference;
				}
			}

		case "BinaryExpression":
			if (tree.operator === "+") {
				let concat = new Concatenation(toSymbolic(tree.left, context), toSymbolic(tree.right, context));
				concat.position = { start : tree.start, end : tree.end };
				return concat;
			}
			break;

		case "MemberExpression":
			let memberExpression = flattenMemberExpression(tree, context);

			if (resolveIdentfier) {
				let res = resolveMemberExpression(memberExpression, context);
				if (!res.position) {
					res.position = { start : tree.start, end : tree.end };
				}
				return res;
			}

			let memberExpr = new MemberExpression(memberExpression);
			memberExpr.position = { start : tree.start, end : tree.end };
			return memberExpr;

		case "NewExpression":
			let args = [];
			for (let i=0; i<tree.arguments.length; i++) {
				args.push(toSymbolic(tree.arguments[i], context));	
			}

			if (tree.callee.type === "Identifier") {
				let functionName = tree.callee.name;

				if (context.scope.has(functionName)) {
					let localFunctionCall = new LocalFunctionCall(context.scope.get(functionName), args);
					localFunctionCall.position = { start : tree.start, end : tree.end };
					return localFunctionCall;
				} else {
					let globalFunctionCall = new GlobalFunctionCall(functionName, args);
					globalFunctionCall.position = { start : tree.start, end : tree.end };
					return globalFunctionCall;
				}
			}

			if (tree.callee.type === "MemberExpression") {
				let members = flattenMemberExpression(tree.callee, context);
				let objectFunctionCall = new ObjectFunctionCall(members, args);
				objectFunctionCall.position = { start : tree.start, end : tree.end };
				return objectFunctionCall;
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
			obj.position = { start : tree.start, end : tree.end };
			return obj;

		case "ArrayExpression":
			let arr = new ArrayStructure();
			for (let i=0; i<tree.elements.length; i++) {
				let element = tree.elements[i];
				arr.values.push(toSymbolic(element, context));
			}
			arr.position = { start : tree.start, end : tree.end };
			return arr;

		case "CallExpression":
			let invocation = new FunctionInvocation();
			invocation.fnct = toSymbolic(tree.callee, context);
			invocation.arguments = [];

			for (let j=0; j<tree.arguments.length; j++) {
				invocation.arguments.push(toSymbolic(tree.arguments[j], context));
			}

			context.result.invocations.push(invocation);
			invocation.position = { start : tree.start, end : tree.end };
			return invocation;
			
	}

	var unknown = new Unknown();
	unknown.position = { start : tree.start, end : tree.end };
	return unknown;
}

exportFnct.toSymbolic = toSymbolic;

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
			let leftPartRemaining = clone(left);
			leftPartRemaining.parts = subsetMemberExpression;
			memberExpressionAssignment(leftPartRemaining, right, assignations);
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

exportFnct.memberExpressionAssignment = memberExpressionAssignment;

/**
 * Merge the content of two AnalysisResult.
 */
function mergeResult(result1, result2) {
	result2.assignations.forEach(function (value, key, map) {
		result1.assignations.set(key, value); 
	});
}

exportFnct.mergeResult = mergeResult;

/**
 * Perform the main analysis to retrieve :
 *  - The list of all the function call.
 *  - The list of all the variable and their symbolic value.
 */
function analysis(tree, result, scope, scopeName, partialScope, useNewScope) {
	// Default value - START
	if (typeof result === "undefined") {
		result = new AnalysisResult();
	}

	if (typeof scope === "undefined") {
		scope = new Map();
	}

	if (typeof scopeName === "undefined") {
		scopeName = "G" + CONST_SEPARATOR_ID;
	}

	if (typeof partialScope === "undefined") {
		partialScope = false;
	}

	if (typeof useNewScope === "undefined") {
		useNewScope = true;
	}
	// Default value - END

	if (tree.body && !Array.isArray(tree.body)) {
		tree.body = [tree.body];
	}

	if (tree.left || tree.right) {
		tree.body = [];
		tree.left  && tree.body.push(tree.left);
		tree.right && tree.body.push(tree.right);
	}

	switch (tree.type) {
		case "ExpressionStatement":
			tree = { body : [tree] };
			break;

		case "SequenceExpression":
			tree.body = tree.expressions;
			break;

		case "CallExpression":
		case "AssignmentExpression":
			tree = { body : [tree] };
			break;
	}

	if (!tree.body) {
		return new Map();
	}

	if (useNewScope) {
		var newScope = new Map(scope);
		var listVar  = collectVar(tree, !partialScope, true);

		for (let i=0; i<listVar.length; i++) {
			let variableName = listVar[i];
			newScope.set(variableName, scopeName + variableName);
		}
	} else {
		newScope = scope;
	}

	if (tree.type === "FunctionDeclaration" || tree.type === "FunctionExpression") {
		for (let i = 0; i < tree.params.length; i++) {
			let arg = tree.params[i];

			if (arg.type === "Identifier") {
				newScope.set(arg.name, scopeName + arg.name);
				let fnctReference = "anon" + (Math.random().toString(16).substr(2)); //anonymous function, need to deal with it
				if (tree.id && tree.id.name) {
					fnctReference = scope.get(tree.id.name);
				}
				let fnctArg = new FunctionArgument(fnctReference, arg.name, i);
				fnctArg.position = { start: arg.start, end: arg.end };
				result.assignations.set(scopeName + arg.name, fnctArg);
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

			case "BinaryExpression":
			case "SequenceExpression":
				analysis(element, result, newScope, scopeName, true, false);
				break;

			case "AssignmentExpression":
				// Operator length of 2 means it's an operation + assignment (ex.: +=)
				// We rewirte the AST so that "a += b" is handled as "a = a + b"
				if (element.operator.length === 2) {
					let newElement = {
                                                "type" : "BinaryExpression",
                                                "start" : element.start,
                                                "end" : element.end,
						"left" : element.left,
                                                "operator" : element.operator[0],
                                                "right" : element.right
                                        };
					element.right = newElement;
					element.operator = "=";
				}

				let symbolicLeft = toSymbolic(element.left, context, false);
				let symbolicRight = toSymbolic(element.right, context);

				if (symbolicLeft instanceof Reference) {
					result.assignations.set(symbolicLeft.name, symbolicRight);
				} else if (symbolicLeft instanceof MemberExpression) {
					memberExpressionAssignment(symbolicLeft, symbolicRight, result.assignations);
				} else {
					result.assignations.set(symbolicLeft, symbolicRight);
				}

				// Dependency injection detection for Angular 1.x (fnct.$inject = [...])
				// When this kind of binding exists we consider the function injected to be
				// called with the parameter injected.
				if (symbolicLeft instanceof MemberExpression && symbolicRight instanceof ArrayStructure) {
					let leftParts = symbolicLeft.parts;
					let lastPart = leftParts[leftParts.length - 1];
					
					if (lastPart instanceof Constant && lastPart.value === "$inject") {
						let invocation = new FunctionInvocation();
						
						if (leftParts.parts > 2) {
							invocation.fnct = new MemberExpression(leftParts.slice(0, -1));
						} else {
							invocation.fnct = leftParts[0];
						}
						
						invocation.arguments = [];

						for (let i=0; i<symbolicRight.values.length; i++) {
							let reference = new Reference("G" + CONST_SEPARATOR_ID + symbolicRight.values[i].value);
							invocation.arguments.push(reference);
						}

						result.invocations.push(invocation);
					}
				}


				break;

			case "CallExpression":
				let invocation = toSymbolic(element, context);
				break;

			case "ExpressionStatement":
				analysis(element.expression, result, newScope, scopeName, true, false);
				break;

			case "FunctionDeclaration":
			case "FunctionExpression":
				break;

			default:
				if (element.body) {
					let resultFunction = analysis(element, result, newScope, scopeName + "LS" + i + CONST_SEPARATOR_ID, true, true);
					mergeResult(result, resultFunction);
				}
				break;
		}
	}

	if (!partialScope) {
		let functions = collectFunction(tree);

		for (let i=0; i<functions.length; i++) {
			let element = functions[i];
			let resultFunction = analysis(element, result, newScope, scopeName + "FS" + i + CONST_SEPARATOR_ID, false, true);

			mergeResult(result, resultFunction);
		}

	}

	return result;
}

exportFnct.analysis = analysis;

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

exportFnct.postProcessingGatherArgument = postProcessingGatherArgument;

/**
 * Returns the value of an "arg" given the resolved value of the function argument.
 *
 * arg - The value that we will be replacing the symbolic function argument from and generated an "evaluated" value.
 * result - The result of the first pass analysis.
 * functionReference - The reference to the function that we are replacing argument.
 * functionArgsPosition - Array of the argument position of the value contained in "resolvedFunctionArgs".
 * resolvedFunctionArgs - Array of the argument value.
 * usePlaceHolderForUnknown - Whether we replace unknown value with the placeholder value.
 */
function postProcessingResolveArgumentWithValue(arg, result, functionReference, functionArgsPosition, resolvedFunctionArgs, usePlaceHolderForUnknown) {
	if (typeof usePlaceHolderForUnknown === "undefined") {
		usePlaceHolderForUnknown = true;
	}

	var symbolicValue;
	var evaluatedValue;
	var finished = true; // If there are remaining function argument that weren't replaced.
	var unknownPosition = [];

	switch (arg.constructor.name) {
		case "Constant":
			evaluatedValue = arg.value;
			symbolicValue = arg;
			unknownPosition = [];
			break;

		case "ObjectStructure":
			symbolicValue = new ObjectStructure(arg.type);
			evaluatedValue = {};
			unknownPosition = {};

			arg.properties.forEach(function (value, key, map) {
				var subResult = postProcessingResolveArgumentWithValue(value, result, functionArgsPosition, resolvedFunctionArgs);

				evaluatedValue[key] = subResult.evaluated;
				symbolicValue.properties.set(key, subResult.symbolic);
				finished &= subResult.finished;
				unknownPosition[key] = subResult.unknownPosition;
			});
			break;

		case "Concatenation":
			let leftSide = postProcessingResolveArgumentWithValue(arg.values[0], result, functionReference, functionArgsPosition, resolvedFunctionArgs);
			let rightSide = postProcessingResolveArgumentWithValue(arg.values[1], result, functionReference, functionArgsPosition, resolvedFunctionArgs);

			evaluatedValue = leftSide.evaluated + rightSide.evaluated;
			symbolicValue = new Concatenation(leftSide.symbolic, rightSide.symbolic);
			finished &= leftSide.finished && rightSide.finished;
			unknownPosition = leftSide.unknownPosition.concat(rightSide.unknownPosition);
			break;

		case "FunctionArgument":
			// This check makes sure that when we replace a function argument, it's for an argument of the right function.
			if (arg.fnct === functionReference && functionArgsPosition.indexOf(arg.index) !== -1) {
				positionArg = functionArgsPosition.indexOf(arg.index);
				evaluatedValue = resolvedFunctionArgs[positionArg];
				symbolicValue = new Constant(evaluatedValue);
				unknownPosition = [arg.position];
			} else {
				// In this branch we hit a function argument that we can't replace.
				finished = false;
				evaluatedValue = PLACEHOLDER_VARIABLE;
				symbolicValue = arg;
				unknownPosition = [arg.position];
			}
			break;

		default:
			symbolicValue = arg;
			unknownPosition = [symbolicValue.position];

			if (usePlaceHolderForUnknown) {
				evaluatedValue = PLACEHOLDER_VARIABLE;
			} else {
				evaluatedValue = arg;
			}
			break
	}

	return {
		symbolic : symbolicValue,
		evaluated : evaluatedValue,
		finished : finished,
		unknownPosition : unknownPosition
	};
}

exportFnct.postProcessingResolveArgumentWithValue = postProcessingResolveArgumentWithValue;

/**
 * Returns the list of all possible value an "arg" value can hold.
 */
function postProcessingResolveArgument(arg, result, usePlaceHolderForUnknown) {
	if (typeof usePlaceHolderForUnknown === "undefined") {
		usePlaceHolderForUnknown = true;
	}

	var functionArgs = postProcessingGatherArgument(arg);
	var functionArgsPosition = [];
	var resolvedFunctionArgs = [];

	// This prioritizes which function argument to resolve first.
	// The priority goes to function parameter that are deeper.
	functionArgs.sort(function (functionArgA, functionArgB) {
		var valueA = functionArgA.fnct.split(CONST_SEPARATOR_ID).length;
		var valueB = functionArgB.fnct.split(CONST_SEPARATOR_ID).length;

		// Descending order
		return valueB - valueA;
	});

	if (functionArgs.length > 0) {
		let functionReference = functionArgs[0].fnct;
		let output = [];

		for (let i=0; i<result.invocations.length; i++) {
			let invocation = result.invocations[i];

			if (invocation.fnct.constructor.name === "Reference" && invocation.fnct.name === functionReference) {
				let toResolve = functionArgs.map(function (arg) { return invocation.arguments[arg.index]; });
				let res = postProcessingResolveArgument(toResolve, result, usePlaceHolderForUnknown);
				res = res.map(function (val) { return val.map(function (val) { return val.output }); });
				
				functionArgsPosition = functionArgs.map(function (arg) { return arg.index; });
				resolvedFunctionArgs = resolvedFunctionArgs.concat(res);
			}
		}

		// If no invocation to the function are found, we consider the function argument to have unknown possible value.
		if (resolvedFunctionArgs.length === 0) {
			functionArgsPosition = [ functionArgs[0].index ];
			resolvedFunctionArgs = [ [ PLACEHOLDER_VARIABLE ] ];
		}

		let finished = true;
		let outputEvaluated = [];
		let intermediateSymbolic = [];

		for (let i=0; i<resolvedFunctionArgs.length; i++) {
			let resOutputEvaluated = [];
			let resIntermediateSymbolic = [];

			for (let j=0; j<arg.length; j++) {
				let argResult = postProcessingResolveArgumentWithValue(arg[j], result, functionReference, functionArgsPosition, resolvedFunctionArgs[i], usePlaceHolderForUnknown);
				resOutputEvaluated.push({ output : argResult.evaluated, unknownPosition : argResult.unknownPosition });
				resIntermediateSymbolic.push(argResult.symbolic);
				finished &= argResult.finished;
			}

			outputEvaluated.push(resOutputEvaluated);
			intermediateSymbolic.push(resIntermediateSymbolic);
		}

		// If all argument variable have been considered we are done.
		if (finished) {
			return outputEvaluated;
		}

		// For this branch there are still argument variable that we haven't tried to resolve.
		// We redo the same analysis, but with the intermediate symbolic value that has at least the first argument resolved.
		for (let i=0; i<intermediateSymbolic.length; i++) {
			let res = postProcessingResolveArgument(intermediateSymbolic[i], result, usePlaceHolderForUnknown);
			output = output.concat(res);
		}
		return output;
	} else {
		// When no argument are found, we simply evaluate it with no argument to replace.
		let output = [];
		let res = [];

		for (let j=0; j<arg.length; j++) {
			let resWithArg = postProcessingResolveArgumentWithValue(arg[j], result, null, [], [], usePlaceHolderForUnknown);
			res.push({ output : resWithArg.evaluated, unknownPosition : resWithArg.unknownPosition });
		}

		output.push(res);
		return output;
	}
}


exportFnct.postProcessingResolveArgument = postProcessingResolveArgument;

module.exports = exportFnct;
