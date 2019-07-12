function getInstance(options) {
	// INIT
	var self = {};

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
		return node;
	}
	self.addNode = addNode;

	function getNode(nodeId) {
		return nodes[nodeId];
	}
	self.getNode = getNode;

	function getNodes() {
		return Object.values(nodes);
	}
	self.getNodes = getNodes;

	function linkNodeToNode(node1, node2) {
		node1.equivalence.push(node2);
	}
	self.linkNodeToNode = linkNodeToNode;

	function linkNodetoInvocation(node, invocation) {
		node.invocations.push(invocation);
	}
	self.linkNodetoInvocation = linkNodetoInvocation;

	function addInvocation(invocation) {
		if (!invocation.id) {
			invocation.id = generateId();
		}

		if (!invocation.arguments) {
			invocation.arguments = [];
		} 

		invocations[invocation.id] = invocation;
		return invocation;
	}
	self.addInvocation = addInvocation;

	function getInvocation(id) {
		return invocations[id];
	}
	self.getInvocation = getInvocation;

	function getInvocations() {
		return Object.values(invocations);
	}
	self.getInvocations = getInvocations;

	function addValue(value) {
		if (!value.id) {
			value.id = generateId();
		}

		values[value.id]  = value;
		return value;
	}
	self.addValue = addValue;

	function getValue(id) {
		return values[id];
	}
	self.getValue = getValue;

	// INTERNAL
	function generateId() {
		var p1 = Math.random().toString(16).substr(2);
		var p2 = Math.random().toString(16).substr(2);
		return p1 + p2;
	}

	// END
	return self;
}

module.exports = {
	getInstance : getInstance
}
