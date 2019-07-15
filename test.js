var utils = require('./utils');
var fs = require('fs');
var acorn = require('acorn');
var Context = require('./classes/context');
var graph = require("./graph/main");

var graphInst = graph.getInstance("memory", {});
var code = fs.readFileSync("examples/code.js");
var tree = acorn.parse(code);
var result = utils.analysis(tree, new Context(graphInst));

console.log(result.graph.getNodes());
console.log(result.graph.getInvocations());