// let's prepare our search string

function createRange(from, to){
	var a = "";
	for(var i = from.charCodeAt(), n = to.charCodeAt(0); i <= n; ++i){
		a += String.fromCharCode(i);
	}
	return a;
}

var chars = createRange("a", "z") + createRange("A", "Z") + createRange("0", "9");

var SAMPLES = 10000000;

var ALTERNATIVES_MIN = 1;
var ALTERNATIVES_MAX = 10;

var PATTERN_LENGTH_MIN = 1;
var PATTERN_LENGTH_MAX = 5;

var D_RATIO = 0.1;
var W_RATIO = 0.1;

function randomString(n){
	var a = "", l = chars.length;
	for(var i = 0; i < n; ++i){
		a += chars.charAt(Math.floor(Math.random() * l));
	}
	return a;
}

function randomPattern(n){
	var a = "", l = chars.length;
	for(var i = 0; i < n; ++i){
		var ratio = Math.random();
		if(ratio < D_RATIO){
			a += "\\d";
			continue;
		}
		ratio -= D_RATIO;
		if(ratio < W_RATIO){
			a += "\\w";
			continue;
		}
		a += chars.charAt(Math.floor(Math.random() * l));
	}
	return a;
}

function rand(from, to){
	return from + Math.floor(Math.random() * (to - from));
}

function randomPatternSet(){
	var n = rand(ALTERNATIVES_MIN, ALTERNATIVES_MAX),
		p = [];
	for(var i = 0; i < n; ++i){
		var l = rand(PATTERN_LENGTH_MIN, PATTERN_LENGTH_MAX);
		p.push(randomPattern(l));
	}
	return p;
}

function cvtToRegExpArray(p){
	return p.map(function(pattern){
		return new RegExp("^(?:" + pattern + ")");
	});
}

function cvtToRegExp(p){
	return new RegExp("^(?:(" + p.join(")|(") + "))");
}


var p = randomPatternSet();

function benchArray(patterns){
	var p = cvtToRegExpArray(patterns), pl = p.length;
	for(var i = 0; i < SAMPLES; ++i){
		var s = randomString(16);
		for(var j = 0; j < pl; ++j){
			var m = p[j].exec(s);
			if(m){
				break;
			}
		}
	}
}

function benchRegExp(patterns){
	var p = cvtToRegExp(patterns), pl = patterns.length;
	for(var i = 0; i < SAMPLES; ++i){
		var s = randomString(16);
		var m = p.exec(s);
		if(m){
			for(var j = 1; j <= pl; ++j){
				if(m[j]){
					break;
				}
			}
		}
	}
}

function bench(f){
	var snapshot = process.hrtime();
	f();
	var diff = process.hrtime(snapshot);
	console.log(f.name + " took " + (diff[0] + diff[1] * 1e-9) + " seconds.");
}

bench(function regex(){ benchRegExp(p); });
bench(function array(){ benchArray(p); });
