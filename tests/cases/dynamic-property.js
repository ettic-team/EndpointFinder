var a = { 
	"aaa" : "/test1",
	"bbb" : "/test2"
}

var bbb = "aaa"; 

var xhr = new XMLHttpRequest();
xhr.open("GET", a[bbb], false);
xhr.send(null);
