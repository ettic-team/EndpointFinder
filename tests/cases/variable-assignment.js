var a = "/test1";

var xhr = new XMLHttpRequest();
xhr.open("GET", a, false);
xhr.send(null);

var b = a + "2";

var xhr = new XMLHttpRequest();
xhr.open("GET", b, false);
xhr.send(null);
