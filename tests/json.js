/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(["../topDown/Grammar"], function(Grammar){
	"use strict";

	var rule = Grammar.rule, any = Grammar.any, maybe = Grammar.maybe, repeat = Grammar.repeat;

	var ws = {id: "ws", pattern: /\s+/}

	var json = new Grammar();

	json.addRule("ws", ws);

	json.addRule("value",  any(rule("array"), rule("string"), rule("number"),
		["-", rule("number")], "true", "false", "null"));
	json.addRule("array",  ["[", maybe(rule("value"), repeat(",", rule("value"))), "]"]);
	json.addRule("string", ["\"", repeat(any(/[^\"\\]+/, /\\./)), "\""]);
	json.addRule("number", [any("0", [/[1-9]/, repeat(/\d+/)]),
		maybe(".", repeat(/\d+/)),
		maybe(/[eE]/, maybe(maybe(any("-", "+")), repeat(/\d+/)))
	]);

	json.generate();

	return json;
});
