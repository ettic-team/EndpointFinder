function test(a) {
	a.get("/test1");
	a.post("/test2");
	a.delete("/test3");
	a.head("/test4");
	a.jsonp("/test5");
	a.patch("/test6");
	a.put("/test7");
}

test.$inject = ["$http"];