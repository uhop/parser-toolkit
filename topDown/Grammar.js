/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function(){
	"use strict";

	function Grammar(grammar){
		var keys = Object.keys(grammar);
		// convert rules
		keys.forEach(function(name){
			var rule = grammar[name];
			this[name] = rule = rule instanceof Array ? rule : [rule];
			rule.name = name;
		}, this);
		// expand internal references and prepare states
		var expand = makeExpander(this);
		keys.forEach(function(name){
			if(this[name] instanceof Array){
				this[name] = walk(this[name], expand);
			}
		}, this);
	};

	// rules

	function rule(name){
		return function(grammar){
			return grammar[name];
		};
	}

	function any(){
		var rule = Array.prototype.slice.call(arguments, 0);
		if(rule.length > 1){
			rule.any = true;
		}
		return rule;
	}

	function maybe(){
		var rule = Array.prototype.slice.call(arguments, 0);
		rule.optional = true;
		return rule;
	}

	function repeat(){
		var rule = Array.prototype.slice.call(arguments, 0);
		rule.optional = true;
		rule.repeatable = true;
		return rule;
	}

	// utilities

	function walk(item, action){
		item = action(item);
		if(item instanceof Array && !item.inspected){
			item.inspected = true;
			if(!item.length){
				throw Error("Empty rule: " + (item.name || "internal"));
			}
			item.forEach(function(value, index){
				item[index] = walk(value, action);
			});
		}
		return item;
	}

	function makeExpander(grammar){
		return function expand(item){
			for(; typeof item == "function"; item = item(grammar));
			if(typeof item == "string"){
				return {tokens: [makeTokenFromString(item)]};
			}
			if(item instanceof RegExp){
				return {tokens: [makeTokenFromRegExp(item)]};
			}
			if(item.pattern){
				return {tokens: [sanitizeToken(item)]};
			}
			return item;
		};
	}

	function makeTokenFromString(literal){
		return {
			id:      literal,
			literal: true,
			pattern: new RegExp("^(?:" + toRegExpSource(literal) + ")")
		};
	}

	function makeTokenFromRegExp(literal){
		return {
			id:      literal.source,
			literal: false,
			pattern: new RegExp("^(?:" + literal.source + ")")
		};
	}

	function sanitizeToken(token){
		var p = (typeof token.pattern == "string" ?
				makeTokenFromString : makeTokenFromRegExp)(token.pattern),
			t = Object.create(token);
		t.literal = p.literal;
		t.pattern = p.pattern;
		return t;
	}

	function toRegExpSource(s){
		return /^[a-zA-Z]\w*$/.test(s) ? s + "\\b" :
			s.replace(/[#-.]|[[-^]|[?|{}]/g, "\\$&");
	}

	// export

	Grammar.rule   = rule;
	Grammar.any    = any;
	Grammar.maybe  = maybe;
	Grammar.repeat = repeat;

	return Grammar;
});
