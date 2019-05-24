var t = "/test";

t += "abc";

var xhr = new XMLHttpRequest();
xhr.open("GET", t, true);
xhr.send(null);
