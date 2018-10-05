var acorn = require("acorn");
var _ = require("lodash");
var fs = require("fs");

/**
 * Classes to represent the stucture used in the utility.
 */

function Reference(name) {
	this.name = name;
}

Reference.prototype.toHumanValue = function () {
	return "@{" + this.name.split("$").pop() + "}";
}

function Constant(value) {
	this.value = value;
}

Constant.prototype.toHumanValue = function () {
	return this.value;
}

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

function ObjectFunctionCall(members, args) {
	this.members = members;
	this.arguments = args;
}

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

function Unknown() {

}

Unknown.prototype.toHumanValue = function () {
	return "@{UNKNOWN}";
}

function FunctionInvocation() {
	this.fnct = null;
	this.arguments = [];
}

function AnalysisResult() {
	this.assignations = new Map();
	this.invocations = [];
}

function Context(scope, result) {
	this.scope = scope;
	this.result = result;
}

/**
 * Analysis function
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

function resolveReference(variableName, context) {
	let referenceIdentifier = context.scope.get(variableName);

	if (context.result.assignations.has(referenceIdentifier)) {
		return context.result.assignations.get(referenceIdentifier);
	} else {
		console.log("No reference to variable " + variableName + " (" + referenceIdentifier + ") found.");
		if (typeof referenceIdentifier === "undefined") {
			referenceIdentifier = variableName;
		}
		return new Reference(referenceIdentifier);
	}
}

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

function mergeResult(result1, result2) {
	result2.assignations.forEach(function (value, key, map) {
		result1.assignations.set(key, value);
	});
}

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

						if (symbolicLeft instanceof Reference) {
							result.assignations.set(symbolicLeft.name, toSymbolic(element.expression.right, context));
						} else {
							result.assignations.set(symbolicLeft, toSymbolic(element.expression.right, context));
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

var code = fs.readFileSync("code.js");
var tree = acorn.parse(code);
var result = analysis(tree);

//console.log(JSON.stringify(tree));
//console.log(JSON.stringify(result.invocations));
//console.log(result.assignations);

for (let i=0; i<result.invocations.length; i++) {
	let fnctInvocation = result.invocations[i];
	let output = fnctInvocation.fnct.toHumanValue();

	output += "(";
	output += fnctInvocation.arguments.map(function(arg) { return '"' + arg.toHumanValue() + '"'; }).join(",");
	output += ")";

	console.log(output);
}