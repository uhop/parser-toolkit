/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function(){

	function makeRegistry(grammar){
		var registry = [];
		for(var name in grammar){
			if(grammar.hasOwnProperty(name) && grammar[name] instanceof Array){
				var rule = grammar[name];
				if(!rule._callers){
					rule._callers = [];
					registry.push(rule);
					enumerateRule(rule, registry);
				}
			}
		}
		return registry;
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

	function makePattern(state){
		var patterns = state.tokens.map(function(token){
				var pattern = token.pattern.source;
				return pattern.substring(4, pattern.length - 1);
			});
		state.pattern = new RegExp("^(?:(" + patterns.join(")|(") + "))");
	}

	function makeStates(registry){
		registry.forEach(function(rule, index){
			if(!rule._state){
				makeState(rule);
			}
			if(!rule.name){
				rule.name = "_rule" + index;
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

	function inlineStates(registry){
		registry.forEach(function(rule){
			rule.forEach(function(item, index){
				if(item instanceof Array){
					rule[index] = item._state;
				}
			});
		});
	}

	function mergeStates(registry){
		registry.forEach(function(rule){
			if(!rule.any){
				for(var i = 0, n = rule.length; i < n; ++i){
					if(!rule[i].optional){
						break;
					}
				}
				for(++i; i < n; ++i){
					if(rule[i].optional){
						break;
					}
				}
				if(i >= n - 1){
					return;
				}
				var mark = i, newRule = [];
				for(; i < n; ++i){
					var item = rule[i], tokens = null, opt = true;
					opt: if(item.optional){
						tokens = item.tokens.slice(0);
						for(var j = i + 1; j < n; ++j){
							var next = rule[j];
							tokens.push.apply(tokens, next.tokens);
							if(!next.optional){
								opt = false;
								i = j;
								break opt;
							}
						}
						i = j;
					}
					newRule.push(tokens ? {tokens: tokens, optional: opt} : item);
				}
				if(mark + newRule.length < rule.length){
					rule.splice.apply(rule, [mark, rule.length - mark].concat(newRule));
				}
			}
		});
	}

	function printRegistry(registry){
		registry.forEach(printRule);
	}

	function printRule(rule){
		console.log(rule.name + " (" + rule.length + " items)");
		printFlags(rule, "  ");
		printItem(rule._state);
		rule.forEach(function(item, index){
			printItem(item, index);
		});
	}

	function printItem(item, index){
		if(item instanceof Array){
			console.log("********************");
			console.log("  rule/" + index + ": " + item.name);
			console.log("********************");
		}else{
			if(isNaN(index) || index < 0){
				console.log("  state");
			}else{
				console.log("  item/" + index);
			}
			printFlags(item);
			item.tokens.forEach(function(token){
				printToken(token);
			});
		}
	}

	function printFlags(item, lead){
		var flags = getFlag(item, "any") + getFlag(item, "optional") +
				getFlag(item, "repeatable") + getFlag(item, "skip");
		if(flags){
			console.log((lead || "    ") + "flags:" + flags);
		}
	}

	function getFlag(item, name){
		return item[name] ? " " + name : "";
	}

	function printToken(token){
		var next = [];
		if(token.nextArray){
			next = token.nextArray.map(function(rule, index){
				return rule.name + "/" + token.nextIndex[index];
			});
		}
		console.log("    token: " + token.id + " / " + token.pattern.source +
			" " + next.join(", "));
	}

	return function optimize(grammar, inlinedNamed){
		var registry = makeRegistry(grammar);
		makeStates(registry);
		inlineStates(registry);
		//mergeStates(registry);
		registry.forEach(function(rule){
			rule.forEach(function(item){
				makePattern(item);
			});
		});
		printRegistry(registry);
	}
});
