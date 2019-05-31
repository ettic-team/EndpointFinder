// DATA

var nodes = {};
var invocations = {};
var values = {};

// METHOD

function addNode(node) {
	if (!node.id) {
		node.id = generateId();
	}

	if (!node.invocations) {
		node.invocations = [];
	}

	if (!node.equivalence) {
		node.equivalence = [];
	}

	nodes[node.id] = node;
}

function getNode(nodeId) {
	return nodes[nodeId];
}

function linkNodeToNode(node1, node2) {
	node1.equivalence.push(node2);
}

function linkNodetoInvocation(node, invocation) {
	node.invocations.push(invocation);
}

function addInvocation(invocation) {
	if (!invocation.id) {
		invocation.id = generateId();
	}

	if (!invocation.arguments) {
		invocation.arguments = [];
	} 

	invocations[invocation.id] = invocation;
}

function addValue(value) {
	if (!value.id) {
		value.id = generateId();
	}

	values.push(value);
}

// INTERNAL

function generateId() {
	var p1 = Math.random().toString(16).substr(2);
	var p2 = Math.random().toString(16).substr(2);
	return p1 + p2;
}

module.exports = {
	addNode : addNode
}