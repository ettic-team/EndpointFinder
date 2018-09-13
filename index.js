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

function Unknown() {

}

function collectVar(tree, collectVar, collectLet) {
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
		} else if (statement.body && statement.type !== "FunctionDeclaration" && collectVar) {
			variables = _.merge(variables, collectVar(tree, true, false));
		}
	}

	return variables;
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
		default:
			return new Unknown();
	}
}

function analysis(tree, result = new Map(), scope = new Map(), scopeName = "G$", partialScope = false) {
	if (!tree.body) {
		return new Map();
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
		}
	}

	return result;
}

var code = fs.readFileSync("code.js");
var tree = acorn.parse(code);

console.log(JSON.stringify(tree));
console.log(analysis(tree));