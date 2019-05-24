var jasmine = require('jasmine');
var finder = require('../../index');
var fs = require('fs');

function runCaseFile(caseName) {
	var code = fs.readFileSync("tests/cases/" + caseName + ".js");
	var result = finder.getEndpoints(code);
	return result;
}

function checkMissing(resultFound, resultExpected) {
	var missing = [];

	for (let i=0; i<resultExpected.length; i++) {
		if (resultFound.indexOf(resultExpected[i]) === -1) {
			missing.push(resultExpected[i]);
		}
	}

	return missing;
}

describe("Basic", function () {
	it("should support function call", function () {
		var expected = ["/test1", "/test2"];
		var found = runCaseFile("function-call");
		var missing = checkMissing(found, expected);

		expect(missing).toEqual([]);
	});

	it("should support multiple argument with function call", function () {
		var expected = ["/test1/1", "/test2/2"];
		var found = runCaseFile("function-multiple-args");
		var missing = checkMissing(found, expected);
		expect(missing).toEqual([]);
	});

	it("should support object structure tracking", function () {
		var expected = ["/test1", "/test2", "/test3"];
		var found = runCaseFile("object-structure");
		var missing = checkMissing(found, expected);
		expect(missing).toEqual([]);
	});

	it("should map unknown value to a generic value", function () {
		var expected = ["/test/@{VAR}"];
		var found = runCaseFile("unknown-variable");
		var missing = checkMissing(found, expected);
		expect(missing).toEqual([]);
	});

	it("should track variable value across basic assignment", function () {
		var expected = ["/test1", "/test12"];
		var found = runCaseFile("variable-assignment");
		var missing = checkMissing(found, expected);
		expect(missing).toEqual([]);
	});

	it("should support dynamic property", function () {
		var expected = ["/test1"];
		var found = runCaseFile("dynamic-property");
		var missing = checkMissing(found, expected);
		expect(missing).toEqual([]);
	});

	it("should support add equals operation", function () {
		var expected = ["/testabc"];
		var found = runCaseFile("add-equal-operation");
		var missing = checkMissing(found, expected);
		expect(missing).toEqual([]);
	});
});


describe("API support", function () {
	it("should support native XHR API", function () {
		var expected = ["/test"];
		var found = runCaseFile("xhr-simple");
		var missing = checkMissing(found, expected);
		expect(missing).toEqual([]);
	});

	it("should support jQuery API", function () {
		var expected = ["/test1", "/test2", "/test3", "/test4", "/test5"];
		var found = runCaseFile("jquery-simple");
		var missing = checkMissing(found, expected);
		expect(missing).toEqual([]);
	});

	it("should support Angular API", function () {
		var expected = ["/test1", "/test2", "/test3", "/test4", "/test5", "/test6", "/test7"];
		var found = runCaseFile("angular-basic");
		var missing = checkMissing(found, expected);

		expect(missing).toEqual([]);
	});

	it("should support Angular $.inject dependency injection", function () {
		var expected = ["/test"];
		var found = runCaseFile("angular-dependency-injection-dollar-inject");
		var missing = checkMissing(found, expected);
		
		expect(missing).toEqual([]);
		expect(found).not.toContain("/bad");
	});
})

describe("Edge cases", function () {
	it("should support variable assignment to undeclared variable", function () {
		var expected = ["/test"];
		var found = runCaseFile("undeclared-variable");
		var missing = checkMissing(found, expected);
		expect(missing).toEqual([]);
	});

	it("should support function call when chained", function () {
		var expected = ["/test123"];
		var found = runCaseFile("function-call-chained");
		var missing = checkMissing(found, expected);
		expect(missing).toEqual([]);
	});

	it("should support function call in arguments", function () {
		var expected = ["/test345"];
		var found = runCaseFile("function-call-arguments");
		var missing = checkMissing(found, expected);
		expect(missing).toEqual([]);
	});

	it("should support operation separated with comma", function () {
		var expected = ["/test678"];
		var found = runCaseFile("operation-separated-with-comma");
		var missing = checkMissing(found, expected);
		expect(missing).toEqual([]);
	});
});
