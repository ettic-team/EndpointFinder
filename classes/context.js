/// class Context

var CONST_SEPARATOR_ID = require("./constant").CONST_SEPARATOR_ID;

function Context(graph, scopeName, scope, assignations) {
	this.scope = scope || new Map();
	this.assignations = assignations || new Map();
	this.graph = graph;
	this.scopeName = scopeName || "G" + CONST_SEPARATOR_ID;
}

Context.prototype.clone = function () {
	return new Context(this.graph, this.scopeName, this.scope, this.assignations);
}

module.exports = Context;