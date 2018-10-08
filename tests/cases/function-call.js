function doXHR(url) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url, false);
	xhr.send(null);
}

doXHR("/test1")
doXHR("/test2")