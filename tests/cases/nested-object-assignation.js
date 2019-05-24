var obj = {
	"bob" : {
		"alice" : {
			"v" : "bb"
		}
	}
}

obj.bob.alice.vv = "cc";

var url = "/test";

url += obj.bob.alice.v;
url += obj.bob.alice.vv;

$.get(url);
