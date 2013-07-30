/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
(["./Grammar"], function(Grammar){
	"use strict";

	function rule(name){
		return function(grammar){
			return grammar[name];
		};
	}

	function makeRule(flagName, create){
		return function(){
			var rule = Grammar.convertRule(toArray(arguments));
			rule.create = create;
			rule[flagName] = true;
			return rule;
		};
	}

	var any    = makeRule("any",  createAny),
		maybe  = makeRule("rest", createMaybe),
		repeat = makeRule("rest", createRepeat);

	function createAny(grammar){
		if(!this.length){
			throw Error("'any' rule cannot be empty");
		}
		var tokens = [], items = this.splice(0, this.length, {});
		this.create = null;
		this.any = false;
		items.forEach(function(_, index, array){
			var state = extractState(grammar, "any", array, index);
			if(state.arrayStack){
				state.tokens.forEach(function(token){
					var t = Object.create(token);
					t.arrayStack = state.arrayStack.slice(1);
					t.indexStack = state.indexStack.slice(1);
					tokens.push(t);
				});
			}else{
				tokens.push.apply(tokens, state.tokens);
			}
		});
		tokens.sort(function(a, b){
			if(a.literal && !b.literal){
				return -1;
			}
			if(!a.literal && b.literal){
				return 1;
			}
			if(a.id.length < b.id.length){
				return -1;
			}
			if(a.id.length > b.id.length){
				return 1;
			}
			return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
		});
		this[0].tokens = tokens;
	}

	function createMaybe(grammar){
		if(!this.length){
			throw Error("'maybe' rule cannot be empty");
		}
		var items = this.splice(0, this.length, {});
		this.create = null;
		this.rest = false;
		var state = extractState(grammar, "rest", items, 0);
		if(state.arrayStack){
			this[0].tokens = state.tokens.map(function(token){
				var t = Object.create(token);
				t.arrayStack = state.arrayStack;
				t.indexStack = state.indexStack;
				return t;
			});
		}else{
			this[0].tokens = state.tokens;
		}
		this[0].onFail = skip;
	}

	function createRepeat(grammar){
		if(!this.length){
			throw Error("'repeat' rule cannot be empty");
		}
		var items = this.splice(0, this.length, {});
		this.create = null;
		this.rest = false;
		var self = this;
		this.onEnd = function(parser){
			// start from the beginning
			parser.arrayStack.push(self);
			parser.indexStack.push(0);
		}
		var state = extractState(grammar, "rest", items, 0);
		if(state.arrayStack){
			this[0].tokens = state.tokens.map(function(token){
				var t = Object.create(token);
				t.arrayStack = state.arrayStack;
				t.indexStack = state.indexStack;
				return t;
			});
		}else{
			this[0].tokens = state.tokens;
		}
		this[0].onFail = skip;
	}


	// utilities

	function toArray(a){
		return Array.prototype.slice.call(a, 0);
	}

	function skip(parser){
		// skip the rest and return
		parser.arrayStack.pop();
		parser.indexStack.pop();
	}

	function extractState(grammar, flagName, array, index){
		var arrayStack = [array], indexStack = [index + 1];
		if(array[flagName] !== false){
			grammar.assemble(array, flagName);
		}
		var item = array[index];
		while(item instanceof Array){
			arrayStack.push(item);
			indexStack.push(1);
			item = item[0];
		}
		var state = Object.create(item);
		state.arrayStack = arrayStack;
		state.indexStack = indexStack;
		return state;
	}


	return {
		rule:   rule,
		any:    any,
		maybe:  maybe,
		repeat: repeat
	};
});
