function convert(names, def){
	return function(item){
		if(item instanceof Array){
			var o = Object.create(def);
			names.forEach(function(name, i){
				var val = item[i];
				if(typeof val != "undefined"){
					o[name] = val;
				}
			});
			return o;
		}
		return item;
	}
}

function rules(names, def, dict){
	var c = convert(names, def);
	for(var name in dict){
		if(dict.hasOwnProperty(name)){
			dict[name] = c(dict[name]);
		}
	}
}

var names = ["left", "right", "pattern", "next", "action"],
	patterns = ["pattern", "next", "action"];

var syntax = {
		comment1: rules(patterns, {next: "comment1"}, {
			text: [/[^\u000A\u000D\u2028\u2029]+/],
			lf:   [/[\u000A\u2028\u2029]|\u000D\u000A|\u000D/]
		}),
		comment: rules(patterns, {next: "comment"}, {
			text: [/[^\*\u000A\u000D\u2028\u2029]+/],
			star: ["*"],
			lf:   [/[\u000A\u2028\u2029]|\u000D\u000A|\u000D/],
			end:  ["*/"]
		}),
		number: rules(patterns, {next: "number"}, {
			decimalDot: ["."],
			numbers:    [/\d+/],
			e:          [/[eE]/],
			sign:       [/[\-\+]/],
			_default: finalizeNumber
		}),
		string1: rules(patterns, {next: "string1"}, {	// \u0027 is '
			text:  [/[^\\\u0027\u000A\u000D\u2028\u2029]+/],
			bs:    ["\\"],
			escQ1: ["\\\'"],
			escLf: [/\\([\u000A\u2028\u2029]|\u000D\u000A|\u000D)/],
			lf:    [/[\u000A\u2028\u2029]|\u000D\u000A|\u000D/],
			end:   ["\'", "operator"]
		}),
		string2: rules(patterns, {next: "string2"}, {	// \u0022 is "
			text:  [/[^\\\u0022\u000A\u000D\u2028\u2029]+/],
			bs:    ["\\"],
			escQ2: ["\\\""],
			escLf: [/\\([\u000A\u2028\u2029]|\u000D\u000A|\u000D)/],
			lf:    [/[\u000A\u2028\u2029]|\u000D\u000A|\u000D/],
			end:   ["\"", "operator"]
		}),
		regexp: rules(patterns, {next: "regexp"}, {
			text:  [/[^\\\/]+/],
			bs:    ["\\"],
			escQ:  ["\\/"],
			end:   [/\/[gmi]{0,3}/, "operator"]
		}),
		operand: rules(names, {left: 12000, right: 12000, next: "operand"}, {
			// values
			id:     [,, /[A-Za-z_]\w*/, "operator"],
			num:    [,, /\d+(?:\.\d*)?(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?/, "operator"],
			str1:   [,, "\'", "string1"],	// ''
			str2:   [,, "\"", "string2"],	// ""
			regexp: [,, "/", "regexp"],
			funVal: [,, "function", "function"],
			// constants
			"true":      [,,, "operator"],
			"false":     [,,, "operator"],
			"undefined": [,,, "operator"],
			"null":      [,,, "operator"],
			// parentheses
			"(": [,     0],
			"{": [,     0,, "object"],
			"[": [,     0],
			// unary prefix operators
			"new":        [,  9001],
			prefixPlusPlus:   [,  8001, "++"],
			prefixMinusMinus: [,  8001, "--"],
			unaryPlus:    [,  7001, "+"],
			unaryMinus:   [,  7001, "-"],
			"!":          [,  7001],
			"~":          [,  7001],
			"typeof":     [,  7001],
			"void":       [,  7001],
			"delete":     [,  7001]
			"instanceof": [,  5001],
			"yield":      [,  3301],
			// technical
			ws:   [,, /[\u0009\u000B\u000C\u0020\u00A0\uFEFF]+/],
			lf:   [/[\u000A\u2028\u2029]|\u000D\u000A|\u000D/],
			"//": [,,, "comment1"],
			"/*": [,,, "comment"]
		}),
		operator: rules(names, {left: 12000, right: 12000, next: "operand"}, {
			// list separator
			",": [ 1000,  1001],       // list separator
			// parentheses
			sub: [ 9998,     0, "["], // subscription operator
			"]": [    0, 10000,, null],
			arg: [ 8998,     0, "("], // argument block
			")": [    0,  9000,, null],
			// unary operators
			postfixPlusPlus:   [8001, 12000, "++", null],
			postfixMinusMinus: [8001, 12000, "--", null],
			// binary operators
			".":    [10000, 10001]
			"*":    [ 8000,  8001],
			"/":    [ 8000,  8001]
			"%":    [ 8000,  8001]
			"+":    [ 7000,  7001],
			"-":    [ 7000,  7001],
			"<<":   [ 6000,  6001],
			">>":   [ 6000,  6001],
			">>>":  [ 6000,  6001],
			"<":    [ 5000,  5001],
			"<=":   [ 5000,  5001],
			">":    [ 5000,  5001],
			">=":   [ 5000,  5001],
			"in":   [ 5000,  5001],
			"==":   [ 4000,  4001],
			"!=":   [ 4000,  4001],
			"===":  [ 4000,  4001],
			"!==":  [ 4000,  4001],
			"&":    [ 3900,  3901],
			"^":    [ 3800,  3801],
			"|":    [ 3700,  3701],
			"&&":   [ 3600,  3601],
			"||":   [ 3500,  3501],
			"?":    [ 3401,  3400],
			"=":    [ 2001,  2000],
			"*=":   [ 2001,  2000],
			"/=":   [ 2001,  2000],
			"%=":   [ 2001,  2000],
			"+=":   [ 2001,  2000],
			"-=":   [ 2001,  2000],
			"<<=":  [ 2001,  2000],
			">>=":  [ 2001,  2000],
			">>>=": [ 2001,  2000],
			"&=":   [ 2001,  2000],
			"^=":   [ 2001,  2000],
			"|=":   [ 2001,  2000],
			// technical
			ws:   [,, /[\u0009\u000B\u000C\u0020\u00A0\uFEFF]+/],
			lf:   [/[\u000A\u2028\u2029]|\u000D\u000A|\u000D/],
			"//": [,,, "comment1"],
			"/*": [,,, "comment"]
		}),
		statement: rules(patterns, {next: "statement"}, {
			// technical
			ws:   [/[\u0009\u000B\u000C\u0020\u00A0\uFEFF]+/],
			lf:   [/[\u000A\u2028\u2029]|\u000D\u000A|\u000D/],
			"//": [, "comment1"],
			"/*": [, "comment"]
		})
	};
