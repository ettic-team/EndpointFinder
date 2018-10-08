function doXHR(url, id) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url + "/" + id, false);
	xhr.send(null);
}

doXHR("/test1", 1)
doXHR("/test2", 2)