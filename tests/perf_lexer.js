var SAMPLES = 10000000;

var MAX_POWER = 32;

function rand(from, to){
	return from + Math.floor(Math.random() * (to - from));
}

function randomNumber(){
	var n = Math.random();
	if(Math.random() < 0.5){
		n = -n;
	}
	n *= Math.pow(10, rand(0, MAX_POWER));
	return "" + n;
}

var numberLexer = /^\-?(?:0|[1-9]\d*)(?:\.\d*(?:[eE][+-]?\d+)?)?$/;

function regexLexer(s){
	return numberLexer.test(s);
}

function manualLexer1(s){
	var i = 0;
	// sing
	if(s.charAt(0) == "-"){
		++i;
	}
	// first number sequence
	var ch = s.charAt(i++);
	if(ch == "0"){
		ch = s.charAt(i++);
	}else{
		if("1" <= ch && ch <= "9"){
			while(ch = s.charAt(i++), ch && "0" <= ch && ch <= "9");
		}else{
			return false;
		}
	}
	if(!ch){
		return true;
	}
	// possible fraction
	if(ch == "."){
		while(ch = s.charAt(i++), ch && "0" <= ch && ch <= "9");
		if(!ch){
			return true;
		}
	}
	// possible exponent
	if(ch == "e" || ch == "E"){
		ch = s.charAt(i++);
		// posible exponent sign
		if(ch == "+" || ch == "-"){
			ch = s.charAt(i++);
		}
		// exponent
		if(!ch || "0" > ch || ch > "9"){
			return false;
		}
		while(ch = s.charAt(i++), ch && "0" <= ch && ch <= "9");
		if(!ch){
			return true;
		}
	}
	return false;
}

function manualLexer2(s){
	var i = 0;
	// sing
	if(s.charAt(0) == "-"){
		++i;
	}
	// first number sequence
	var ch = s.charAt(i++);
	switch(ch){
		case "0":
			ch = s.charAt(i++);
			break;
		case "1":
		case "2":
		case "3":
		case "4":
		case "5":
		case "6":
		case "7":
		case "8":
		case "9":
			while(ch = s.charAt(i++), ch && "0" <= ch && ch <= "9");
			break;
		default:
			return false;
	}
	switch(ch){
		case "":
			return true;
		case ".":
			while(ch = s.charAt(i++), ch && "0" <= ch && ch <= "9");
			if(!ch){
				return true;
			}
			break;
	}
	switch(ch){
		case "e":
		case "E":
			switch(ch = s.charAt(i++)){
				case "+":
				case "-":
					ch = s.charAt(i++);
					break;
			}
			// exponent
			if(!ch || "0" > ch || ch > "9"){
				return false;
			}
			while(ch = s.charAt(i++), ch && "0" <= ch && ch <= "9");
			if(!ch){
				return true;
			}
	}
	return false;
}

function bench(f){
	var snapshot = process.hrtime();
	f();
	var diff = process.hrtime(snapshot);
	console.log(f.name + " took " + (diff[0] + diff[1] * 1e-9) + " seconds.");
}

function benchRegex(){
	for(var i = 0; i < SAMPLES; ++i){
		if(!regexLexer(randomNumber())){
			throw Error("wrong number");
		}
	}
}

function benchManual1(){
	for(var i = 0; i < SAMPLES; ++i){
		if(!manualLexer1(randomNumber())){
			throw Error("wrong number");
		}
	}
}

function benchManual2(){
	for(var i = 0; i < SAMPLES; ++i){
		if(!manualLexer2(randomNumber())){
			throw Error("wrong number");
		}
	}
}

bench(benchRegex);
bench(benchManual1);
bench(benchManual2);
