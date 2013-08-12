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
			// expand rules
			for(var name in this){
				if(this.hasOwnProperty(name) && this[name] instanceof Array){
					this[name] = this.expand(this[name]);
				}
			}
			// build a registry
			var registry = [];
			for(name in this){
				if(this.hasOwnProperty(name) && this[name] instanceof Array){
					var rule = this[name];
					if(!rule._callers){
						rule._callers = [];
						registry.push(rule);
						enumerateRule(rule, registry);
					}
				}
			}
			// make states
			registry.forEach(function(rule){
				if(!rule._state){
					makeState(rule);
				}
			});
			// inline states
			registry.forEach(function(rule){
				rule.forEach(function(item, index){
					if(item instanceof Array){
						rule[index] = item._state;
					}
				});
			});
			// create patterns
			registry.forEach(function(rule){
				rule.forEach(function(item){
					makePattern(item);
				});
			});
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

	function enumerateRule(rule, registry){
		rule.forEach(function(item, index){
			if(item instanceof Array){
				if(item._callers){
					item._callers.push(rule);
				}else{
					item._callers = [rule];
					registry.push(item);
					enumerateRule(item, registry);
				}
			}else{
				item.tokens.forEach(function(token, i, tokens){
					var t = Object.create(token);
					t.nextArray = [];
					t.nextIndex = [];
					tokens[i] = t;
				});
			}
		});
	}

	function makeState(rule){
		if(rule.any){
			var tokens = [];
			rule.forEach(function(_, index){
				getState(rule, index, true).tokens.forEach(function(token){
					tokens.push(token);
				});
			});
			if(!rule._state){
				rule._state = {};
			}
			rule._state.tokens = tokens;
		}else{
			var i = 0, n = rule.length, tokens = [], optional = true;
			for(; i < n; ++i){
				var state = getState(rule, i);
				tokens.push.apply(tokens, state.tokens);
				if(!state.optional){
					optional = false;
					break;
				}
			}
			if(!rule._state){
				rule._state = {};
			}
			rule._state.tokens   = tokens;
			rule._state.optional = optional || rule.optional;
		}
	}

	function getState(rule, index, naked){
		var item = rule[index];
		if(item instanceof Array){
			if(!item._state){
				makeState(item);
			}
			item = item._state;
		}
		if(!naked){
			var newIndex = index + 1;
			if(newIndex === rule.length && rule.repeatable){
				newIndex = 0;
			}
			if(newIndex < rule.length){
				item = Object.create(item);
				item.tokens = item.tokens.map(function(token){
					var t = Object.create(token);
					t.nextArray = [rule].concat(token.nextArray);
					t.nextIndex = [newIndex].concat(token.nextIndex);
					return t;
				});
			}
		}
		return item;
	}

	function makePattern(state){
		var patterns = state.tokens.map(function(token){
				var pattern = token.pattern.source;
				return pattern.substring(4, pattern.length - 1);
			});
		state.pattern = new RegExp("^(?:(" + patterns.join(")|(") + "))");
	}

	// export

	Grammar.rule   = rule;
	Grammar.any    = any;
	Grammar.maybe  = maybe;
	Grammar.repeat = repeat;

	return Grammar;
});
