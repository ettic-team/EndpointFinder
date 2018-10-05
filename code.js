var a = "/123";
var b = a;
b = a + "123";

var xhr = new XMLHttpRequest();
xhr.open("GET", b + "/" + alklk, true);
xhr.send(null);

function doXHR(url, a) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url + a, true);
	xhr.send(null);
}

doXHR(a, 1);
doXHR(a + "/abcd", 2);