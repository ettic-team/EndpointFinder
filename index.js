var acorn = require("acorn");
var _ = require("lodash");
var fs = require("fs");

function Reference(name) {
	this.name = name;
}

function Constant(value) {
	this.value = value;
}

function Concatenation(value1, value2) {
	this.values = [];
	this.values.push(value1);
	this.values.push(value2);
}

function LocalFunctionCall(reference) {
	this.reference = reference;
}

function GlobalFunctionCall(name) {
	this.name = name;
}

function Unknown() {

}

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

function toSymbolic(tree, scope) {
	switch (tree.type) {
		case "Literal":
			return new Constant(tree.value);

		case "Identifier":
			return new Reference(scope.get(tree.name));

		case "BinaryExpression":
			if (tree.operator === "+") {
				return new Concatenation(toSymbolic(tree.left, scope), toSymbolic(tree.right, scope));
			}
			break;

		case "NewExpression":
			if (tree.callee.type === "Identifier") {
				let functionName = tree.callee.name;
				if (scope.has(functionName)) {
					return new LocalFunctionCall(scope.get(functionName));
				} else {
					return new GlobalFunctionCall(functionName);
				}
			}
			
	}

	return new Unknown();
}

function mergeResult(result1, result2) {
	result2.forEach(function (value, key, map) {
		result1.set(key, value);
	});
}

function analysis(tree, result = new Map(), scope = new Map(), scopeName = "G$", partialScope = false) {
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

	for (let i=0; i<tree.body.length; i++) {
		let element = tree.body[i];

		switch (element.type) {
			case "VariableDeclaration":
				for (let j=0; j<element.declarations.length; j++) {
					let variable = element.declarations[j];
					if (variable.init) {
						result.set(new Reference(newScope.get(variable.id.name)), toSymbolic(variable.init, newScope));
					}
				}
				break;

			case "ExpressionStatement":
				if (element.expression.type === "AssignmentExpression") {
					result.set(toSymbolic(element.expression.left, newScope), toSymbolic(element.expression.right, newScope));
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

console.log(JSON.stringify(tree));
console.log(analysis(tree));