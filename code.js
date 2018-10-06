var a = "/123";
var b = a + "123";
var abcd = { "vvvv" : "/test" }

var xhr = new XMLHttpRequest();
xhr.open("GET", b + "/" + abcd.vvvv, true);
xhr.send(null);

function doXHR(url, a) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url + a, true);
	xhr.send(null);
}

doXHR(a, 1);
doXHR(a + "/abcd", 2);