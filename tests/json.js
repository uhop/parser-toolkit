/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(["../topDown/Grammar"], function(Grammar){
	"use strict";

	var rule = Grammar.rule, any = Grammar.any, maybe = Grammar.maybe, repeat = Grammar.repeat;

	var ws = {id: "ws", pattern: /\s+/},
		// numeric tokens
		nonZero      = {id: "nonZero",      pattern: /[1-9]/},
		exponent     = {id: "exponent",     pattern: /[eE]/},
		numericChunk = {id: "numericChunk", pattern: /\d{1,256}/},
		// string tokens
		plainChunk   = {id: "plainChunk",   pattern: /[^\"\\]{1,256}/},
		escapedChars = {id: "escapedChars", pattern: /\\(?:[bfnrt\"\\]|u[0-9a-fA-F]{4})/};

	var json = new Grammar();

	json.addRule("ws", ws);

	json.addRule("value",  any(rule("object"), rule("array"), rule("string"), rule("number"),
		["-", rule("number")], "true", "false", "null"));
	json.addRule("object", ["{", maybe(rule("pair"), repeat(",", rule("pair"))), "}"]);
	json.addRule("pair",   [rule("string"), ":", rule("value")]);
	json.addRule("array",  ["[", maybe(rule("value"), repeat(",", rule("value"))), "]"]);
	json.addRule("string", ["\"", repeat(any(plainChunk, escapedChars)), "\""]);
	json.addRule("number", [any("0", [nonZero, repeat(numericChunk)]),
		maybe(".", repeat(numericChunk)),
		maybe(exponent, maybe(maybe(any("-", "+")), repeat(numericChunk)))
	]);

	json.generate();

	return json;
});
