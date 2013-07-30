/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function(){
	"use strict";

	var grammar = {
			value: {
				// main tokens
				"{": {
					left: 100,
					right: 0,
					next: "object"
				},
				"[": {
					left: 100,
					right: 0,
					next: "array"
				},
				str: {
					left: 100,
					right: 100,
					pattern: "\"",
					next: "string"
				},
				num: {
					left: 100,
					right: 100,
					pattern: /[-]?\d/,
					next: "number",
					direct: true
				},
				"true": {
					left: 100,
					right: 100
				},
				"false": {
					left: 100,
					right: 100
				},
				"null": {
					left: 100,
					right: 100
				},
				// non-essentials
				ws: {
					left: 0,
					right: 0,
					pattern: /\s+/,
					direct: true
				}
			},
			string: {
				str: {
					left: 100,
					right: 100,
					pattern: /[^\"\\]/,
				},
				quote: {
					left: 100,
					right: 100,
					pattern: /\\\./,
				},
				stop: {
					left: 100,
					right: 100,
					pattern: "\"",
					next: "value"
				}
			},
			array: {
				",": {
					left: 10,
					right: 11
				},
				"]": {
					left: 0,
					right: 100
				}
			}
			object: {
				",": {
					left: 10,
					right: 11
				},
				":": {
					left: 20,
					right: 20
				},
				"]": {
					left: 0,
					right: 100
				}
			}
		};


	var brackets = {"{": "}", "[": "]"};


	var value  = any(string, number, object, array, "true", "false", "null");

	var object = ["{", maybe(pair, repeat(",", pair)), "}"];

	var pair   = [string, ":", value];

	var array  = ["[", maybe(value, repeat(",", value)), "]"];

	var string = ["\"", repeat(any(/[^\"\\]/, "\\.")), "\""];

	var number = [maybe("-"),
			any("0", [/[1-9]/, repeat(/\d+/)]),
			maybe(".", repeat(/\d+/)),
			maybe("/[eE]/", maybe(maybe(any("-", "+")), repeat(/\d+/)))
		];


	function JsonSink(){
		this.stack = [];
		this.state = [];
	}

	JsonSink.prototype = {
		putToken: function(token, parser){
			switch(token.state){
				case "value":
					switch(token.id){
						case "true":
							this.stack.push(true);
							break;
						case "false":
							this.stack.push(false);
							break;
						case "true":
							this.stack.push(null);
							break;
						case "[":
							this.stack.push("array");
							break;
					}
					break;
				case "array":
			}
		},
		putDirectToken: function(token, parser){

		}
	}

	return {
		grammar: grammar
	};
});
