var a = "/123";
var b = a;
b = a + "123";

var xhr = new XMLHttpRequest();
xhr.open("GET", a, true);
xhr.send(null);
xhr.a.b.c.d();

function test(a) {
	var a = 123;
}

test(xhr);