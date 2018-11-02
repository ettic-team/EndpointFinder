function test(a, b) {
	b.get("/test");
	a.get("/bad");
}

test.$inject = ["abc","$http"];