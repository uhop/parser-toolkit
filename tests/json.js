/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(["../topDown/Grammar", "../topDown/rules"], function(Grammar, rules){
	"use strict";

	var rule = rules.rule, any = rules.any, maybe = rules.maybe, repeat = rules.repeat;

	var ws = {id: "ws", pattern: /\s+/}

	var json = new Grammar();
	json.addRule("ws",     ws);
/*
	json.addRule("value",  any(rule("array"), rule("string"), rule("number"), rule("negNumber"),
		"true", "false", "null"));
	json.addRule("array",  ["[", maybe(rule("value"), repeat(",", rule("value"))), "]"]);
	json.addRule("string", ["\"", repeat(any(/[^\"\\]+/, /\\./)), "\""]);
	json.addRule("number", [any("0", [/[1-9]/, repeat(/\d+/)]),
		maybe(".", repeat(/\d+/)),
		maybe("/[eE]/", maybe(maybe(any("-", "+")), repeat(/\d+/)))
	]);
	json.addRule("negNumber", ["-",
		any("0", [/[1-9]/, repeat(/\d+/)]),
		maybe(".", repeat(/\d+/)),
		maybe("/[eE]/", maybe(maybe(any("-", "+")), repeat(/\d+/)))
	]);
*/
	json.addRule("value", any(rule("array")));
	json.addRule("array", ["[", maybe(rule("value")), "]"]);
	json.generate();

	return json;
});
