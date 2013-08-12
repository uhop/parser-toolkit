/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function(){
	"use strict";

	function Grammar(){};

	Grammar.prototype = {
		addRule: function addRule(name, rule){
			this[name] = rule.converted ? rule :
				convertRule(rule instanceof Array ? rule.slice(0) : [rule]);
			this[name].name = name;
		},
		reset: function(){
			Object.keys(this).forEach(function(name){
				if(this.hasOwnProperty(name)){
					delete this[name];
				}
			});
		},
		generate: function generate(){
			for(var name in this){
				if(this.hasOwnProperty(name) && this[name] instanceof Array){
					this[name] = this.expand(this[name]);
				}
			}
		},
		expand: function expand(item){
			while(typeof item == "function"){
				item = item(this);
			}
			if(item instanceof Array && !item.expanded){
				item.expanded = true;
				item.forEach(function(value, index, array){
					array[index] = this.expand(value);
				}, this);
			}
			return item;
		}
	};

	// rules

	function rule(name){
		return function(grammar){
			return grammar[name];
		};
	}

	function any(){
		var rule = convertRule(toArray(arguments));
		if(rule.length > 1){
			rule.any = true;
		}
		return rule;
	}

	function maybe(){
		var rule = convertRule(toArray(arguments));
		rule.optional = true;
		return rule;
	}

	function repeat(){
		var rule = convertRule(toArray(arguments));
		rule.optional = true;
		rule.repeatable = true;
		return rule;
	}

	// utilities

	function convertRule(rule){
		if(!rule.length){
			throw Error("Rule cannot be empty.")
		}
		if(rule.converted){
			return rule;
		}
		rule.converted = true;
		rule.forEach(function(item, index, array){
			if(item instanceof Array && !item.converted){
				array[index] = convertRule(item);
				return;
			}
			if(typeof item == "string" || item instanceof RegExp){
				array[index] = {tokens: [makeToken(item)]};
				return;
			}
			if(item.pattern){
				array[index] = {tokens: [sanitizeToken(item)]};
				return;
			}
		});
		return rule;
	}

	function makeToken(literal){
		var id, source;
		if(literal instanceof RegExp){
			id = source = literal.source;
		}else{
			// typeof literal == "string"
			id = literal;
			source = toRegExpSource(literal);
		}
		return {
			id: id,
			literal: id === literal,
			pattern: new RegExp("^(?:" + source + ")")
		};
	}

	function sanitizeToken(token){
		var p = makeToken(token.pattern),
			t = Object.create(token);
		t.literal = p.literal;
		t.pattern = p.pattern;
		return t;
	}

	function toRegExpSource(s){
		if(/^[a-zA-Z]\w*$/.test(s)){
			return s + "\\b";
		}
		return s.replace(/[#-.]|[[-^]|[?|{}]/g, "\\$&");
	}

	function toArray(a){
		return Array.prototype.slice.call(a, 0);
	}

	// export

	Grammar.rule   = rule;
	Grammar.any    = any;
	Grammar.maybe  = maybe;
	Grammar.repeat = repeat;

	return Grammar;
});
