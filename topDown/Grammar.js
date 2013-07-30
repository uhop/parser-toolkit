/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function(){
	"use strict";

	function Grammar(){};

	Grammar.prototype = {
		addRule: function addRule(name, rule){
			this[name] = rule.converted ? rule :
				convertRule(rule instanceof Array ? rule.slice(0) : [rule]);
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
				if(this.hasOwnProperty(name)){
					this[name] = this.expand(this[name]);
				}
			}
			["any", "rest"].forEach(function(flagName){
				for(name in this){
					if(this.hasOwnProperty(name)){
						this.assemble(this[name], flagName);
					}
				}
			}, this);
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
		},
		assemble: function assemble(item, flagName){
			if(item instanceof Array && item[flagName] && item.create){
				item.create(this);
			}
			if(item instanceof Array && item[flagName] !== false){
				item[flagName] = false;
				item.forEach(function(value){
					if(value instanceof Array && value[flagName] !== false){
						this.assemble(value, flagName);
					}
				}, this);
			}
		}
	};

	function convertRule(rule){
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
			pattern: new RegExp("^(" + source + ")")
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
		if(/\w+/.test(s)){
			return s + "\\b";
		}
		return s.replace(/[#-.]|[[-^]|[?|{}]/g, "\\$&");
	}

	Grammar.convertRule = convertRule;

	return Grammar;
});
