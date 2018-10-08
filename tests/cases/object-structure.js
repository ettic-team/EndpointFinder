var a = { 
	"aaa" : "/test1",
	ccc : "/test3"
}

var xhr = new XMLHttpRequest();
xhr.open("GET", a.aaa, false);
xhr.send(null);

var xhr = new XMLHttpRequest();
xhr.open("GET", a.ccc, false);
xhr.send(null);

a.bbb = "/test2"

var xhr = new XMLHttpRequest();
xhr.open("GET", a.bbb, false);
xhr.send(null);
