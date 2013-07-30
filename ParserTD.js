/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function(){
	"use strict";

	function buildGrammar(value){
		if(!(value instanceof Array)){
			value = [value];
		}
		var p = value.map(function(item){
				if(typeof item == "string" || item instanceof RegExp){
					return {tokens: [makeToken(item)]};
				}
				// otherwise: item instanceof Array
				return item;
			});
		// reverse pass to optimize patterns
		for(var i = p.length - 1, next = null; i >= 0; --i){

		}
	}
});