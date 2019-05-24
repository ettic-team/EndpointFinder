function parent(url) {
	var a = {};

	function doXHR() {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, false);
		xhr.send(null);
	}

	a.trigger = doXHR;
	return a;
}

var obj = parent("/test9010901");
obj.trigger();


function parent2(url) {
	var a = {};

	function doXHR() {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, false);
		xhr.send(null);
	}

	a.trigger = doXHR;
	return a;
}

var obj2 = parent2("/test9010902");