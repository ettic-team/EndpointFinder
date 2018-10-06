var a = "/123";
var b = a + "123";
var abcd = { "vvvv" : "/test" };
abcd.ffff = "bob";
var c = abcd;

var xhr = new XMLHttpRequest();
xhr.open("GET", b + "/" + c.ffff, true);
xhr.send(null);

function doXHR(url, a) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url + a, true);
	xhr.send(null);
}

doXHR(a, 1);
doXHR(a + "/abcd", 2);