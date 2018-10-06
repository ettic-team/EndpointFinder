var acorn = require("acorn");
var _ = require("lodash");
var fs = require("fs");

/**
 * Classes to represent the stucture used in the utility.
 */

/// class Reference

function Reference(name) {
	this.name = name;
}

Reference.prototype.toHumanValue = function () {
	return "@{ref(" + this.name.split("$").pop() + ")}";
}

Reference.prototype.equals = function (val) {
	if (val.constructor.name !== "Reference") {
		return false;
	}

	return this.name === val.name;
}

/// class ObjectStructure

function ObjectStructure(type = "G$Object") {
	this.properties = new Map();
	this.type = type;
}

ObjectStructure.prototype.toHumanValue = function () {
	return "@{obj(" + this.type + ")}";
}

ObjectStructure.prototype.equals = function (val) {
	if (val.constructor.name !== "ObjectStructure") {
		return false;
	}

	if (val.properties.size() !== this.properties.size() || !val.type.equals(this.type)) {
		return false;
	}

	var good = true;

	this.properties.forEach(function (value, key, map) {
		if (!val.properties.has(key)) {
			good = false;
			return;
		}

		if (!val.properties.get(key).equals(value)) {
			good = false;
			return;
		}
	});

	return good;
};

/// class Constant

function Constant(value) {
	this.value = value;
}

Constant.prototype.toHumanValue = function () {
	return this.value;
}

Constant.prototype.equals = function (val) {
	if (val.constructor.name !== "Constant") {
		return false;
	}

	return this.value === val.value;
}

/// class Concatenation

function Concatenation(value1, value2) {
	this.values = [];
	this.values.push(value1);
	this.values.push(value2);
}

Concatenation.prototype.toHumanValue = function () {
	var result = "";
	for (let i=0; i<this.values.length; i++) {
		result += this.values[i].toHumanValue();
	}
	return result;
}

Concatenation.prototype.equals = function (val) {
	if (val.constructor.name !== "Concatenation") {
		return false;
	}

	return val.values[0].equals(this.values[0]) && val.values[1].equals(this.values[1]);
}

/// class LocalFunctionCall

function LocalFunctionCall(reference, args) {
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

	if (!this.reference.equals(val.reference)) {
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

/// class GlobalFunctionCall

function GlobalFunctionCall(name, args) {
	this.name = name;
	this.arguments = args;
}

GlobalFunctionCall.prototype.toHumanValue = function () {
	var result = this.name + "(";
	for (let i=0; i<this.arguments.length; i++) {
		result += this.arguments[i].toHumanValue();
		if (i !== this.arguments.length - 1) {
			result += ",";
		}
	}
	result += ")";
	return result;
}

GlobalFunctionCall.prototype.equals = function (val) {
	if (val.constructor.name !== "GlobalFunctionCall") {
		return false;
	}

	if (this.name !== val.name) {
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

/// class MemberExpression

function MemberExpression(parts) {
	this.parts = parts;
}

MemberExpression.prototype.toHumanValue = function () {
	var result = "";
	for (let i=0; i<this.parts.length; i++) {
		result += this.parts[i].toHumanValue() + ".";
	}
	result = result.substring(0, result.length - 1);
	return result;
}

MemberExpression.prototype.equals = function (val) {
	if (val.constructor.name !== "MemberExpression") {
		return false;
	}

	if (this.parts.length !== val.parts.length) {
		return false;
	}

	var good = true;

	this.parts.forEeach(function (value, key, map) {
		if (!value.equals(val.parts[key])) {
			good = false;
		}
	});

	return good;
}

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

/// class FunctionInvocation

function FunctionInvocation() {
	this.fnct = null;
	this.arguments = [];
}

FunctionInvocation.prototype.equals = function (val) {
	if (val.constructor.name !== "Unknown") {
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

/// class FunctionArgument

function FunctionArgument(fnct, variableName, position) {
	this.name = variableName;
	this.fnct = fnct;
	this.position = position;
}

FunctionArgument.prototype.toHumanValue = function () {
	return "@{arg" + this.position + "(" + this.name + ")}";
}

FunctionInvocation.prototype.equals = function (val) {
	if (val.constructor.name !== "FunctionInvocation") {
		return false;
	}

	if (this.name !== val.name) {
		return false;
	}

	if (!this.fnct.equals(val.fnct)) {
		return false;
	}

	if (this.position !== val.position) {
		return false;
	}

	return true;
}

/// class AnalysusResult

function AnalysisResult() {
	this.assignations = new Map();
	this.invocations = [];
}

/// class Context

function Context(scope, result) {
	this.scope = scope;
	this.result = result;
}

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
			variables = _.merge(variables, collectVar(statement, true, false));
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

	for (let i=0; i<tree.body.length; i++) {
		let statement = tree.body[i];

		if (statement.body) {
			if (statement.type === "FunctionDeclaration") {
				functions.push(statement);
			} else {
				functions = _.merge(functions, collectFunction(statement));
			}
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
			referenceIdentifier = "UG$" + variableName;
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
				let referenceIdentifier = context.scope.get(tree.name);
				return new Reference(referenceIdentifier);
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
				obj.properties.set(property.key.value, toSymbolic(property.value, context));
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
function analysis(tree, result = new AnalysisResult(), scope = new Map(), scopeName = "G$", partialScope = false) {
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

	if (tree.type === "FunctionDeclaration") {
		for (let i = 0; i < tree.params.length; i++) {
			let arg = tree.params[i];

			if (arg.type === "Identifier") {
				newScope.set(arg.name, scopeName + arg.name);
				result.assignations.set(scopeName + arg.name, new FunctionArgument(scope.get(tree.id.name) , arg.name, i));
			}
		}
	}

	var context = new Context(newScope, result);

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
							result.assignations.set(symbolicLeft.name, symbolicRight, context);
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
				break;

			default:
				if (element.body) {
					let resultFunction = analysis(element, result, newScope, scopeName + "LS" + i + "$", true);
					mergeResult(result, resultFunction);
				}
				break;
		}
	}

	if (!partialScope) {
		let functions = collectFunction(tree);

		for (let i=0; i<functions.length; i++) {
			let element = functions[i];
			let resultFunction = analysis(element, result, newScope, scopeName + "FS" + i + "$", false);

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
	var output = [];

	switch (arg.constructor.name) {
		case "Constant":
			return arg.value;

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

	
	//console.log("-------");
	//console.log(arg);
	//console.log("Arguments : ", functionArgs);
	//console.log(resolvedFunctionArgs);
	//console.log(functionArgsPosition);
	//console.log(output);
	//console.log("-------");

	return output;
}

// Main code to test the analysis function
var code = fs.readFileSync("code.js");
var tree = acorn.parse(code);
var result = analysis(tree);

//console.log(JSON.stringify(tree));
//console.log(result.invocations);
//console.log(JSON.stringify(result.invocations));
//console.log(result.assignations);

for (let i=0; i<result.invocations.length; i++) {
	let fnctInvocation = result.invocations[i];

	// Print the information related to the XHR API only. 
	if (fnctInvocation.fnct.parts && 
			fnctInvocation.fnct.parts[0].name === "XMLHttpRequest" &&
			fnctInvocation.fnct.parts[1].value === "open") {

		//let output = fnctInvocation.fnct.toHumanValue();

		//output += "(";
		//output += fnctInvocation.arguments.map(function(arg) { return '"' + arg.toHumanValue() + '"'; }).join(",");
		//output += ")";

		//console.log("----");
		//console.log("Detected XHR call !");
		//console.log(output);
		//console.log("----");

		let possibleValue = postProcessingResolveArgument([fnctInvocation.arguments[1]], result);

		for (let j=0; j<possibleValue.length; j++) {
			console.log("Endpoint found : " + possibleValue[j]);
		}
	}
}