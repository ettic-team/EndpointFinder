var a = "/123";
var b = a;
b = a + "123";

var xhr = new XMLHttpRequest();
xhr.open("GET", b + "/" + alklk, true);
xhr.send(null);

function doXHR(url) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, true);
	xhr.send(null);
}

doXHR(a);
doXHR(a + "/abcd");