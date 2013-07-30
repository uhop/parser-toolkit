/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function(){
	"use strict";

	function Parser(grammar, brackets, expected, sink){
		// grammar
		this.grammar  = {};	// populated later
		this.brackets = brackets;
		this.initialExpected = expected;
		this.sink     = sink;

		this.reset();

		// populate the grammar
		for(var stateName in grammar){
			var state = grammar[stateName];
			if(typeof state == "object"){
				this.grammar[stateName] = prepareState(state, stateName);
			}
		}
	}

	var consumeReadyMode = {consume: 1, bracket: 1, eos: 1};

	Parser.prototype = {

		// public interface

		reset: function(){
			// grammar
			this.expected = this.initialExpected;

			// scanner
			this.buffer = "";
			this.line   = this.pos = 1;
			this.noMore = false;

			// parser
			this.mode  = "supply";
			this.token = null;
			this.stack = [];
		},

		addBuffer: function(buffer, noMore){
			this.buffer += buffer;
			this.noMore = noMore;
		},

		processBuffer: function(){
			for(;;){
				var token = this.getToken();
				if(token === true){
					// need more input
					return true;
				}
				if(token === false){
					// we are done here!
					break;
				}
				if(token === null){
					// no match
					this.grammar[this.expected].onNoMatch(this);
					break;
				}
				// we have a match!
				if(token.direct){
					this.sink.putDirectToken(token, this);
					this.expected = token.next;
				}else{
					//assert(this.state == "supply");
					this.supply(token);
					while(this.mode in consumeReadyMode){
						this.sink.putToken(this.consume(), this);
					}
				}
			}
			return false;
		},

		// private workings

		newLinePattern: /[\u000A\u2028\u2029]|\u000D\u000A|\u000D/g,

		getToken: function(peek){
			var buffer = this.buffer;
			if(!buffer){
				// no input data: true/false for more data
				return !this.noMore;
			}
			var index  = -1, matched = "", m,
				state  = this.grammar[this.expected],
				matchers = state.matchers;
			for(var i = 0, n = matchers.length; i < n; ++i){
				m = buffer.match(matchers[i]);
				if(m && m[1].length > matched.length){
					matched = m[1];
					index = i;
				}
			}
			if(index < 0){
				// no match
				return null;
			}
			if(!this.noMore && matched.length == buffer.length){
				// need more information
				return true;
			}
			var token   = Object.create(state.tokens[index]);
			token.value = matched;
			token.line  = this.line;
			token.pos   = this.pos;
			// update line and position, if it was not a peek
			if(!peek){
				var self = this, rest = matched.length;
				matched.replace(this.newLinePattern, function(match, offset){
					rest = matched.length - match.length - offset;
					++self.line;
					self.pos = 1;
					return "";
				});
				this.pos += rest;
				this.buffer = buffer.substring(matched.length);
			}
			// done
			return token;
		},

		supply: function(token, priority){
			//assert(this.mode == "supply");
			this.token = token;
			this._decide(priority);
		},

		consume: function(priority){
			if(this.mode == "eos"){
				this.mode = "done";
				return this.token;
			}

			//assert((this.mode in consumeReadyMode) && this.stack.length);
			var t = this.stack.pop();

			if(this.mode == "consume"){
				this._decide(priority);
			}else{
				//assert(this.mode == "bracket");
				this.stack.push(this.token);
				this.mode = "supply";
			}

			return t;
		},

		_decide: function(priority){
			var token = this.token, stack = this.stack, top = stack[stack.length - 1],
				left  = token.left, right = (top ? top.right : priority) || 0;

			if(left > right){
				this.expected = token.next;
				stack.push(token);
				this.mode = "supply";
			}else if(left < right){
				this.mode = top ? "consume" : "eos";
			}else{
				if(this.brackets[top.id] === token.id){
					this.mode = "bracket";
				}else{
					throw Error("Unbalanced brackets or operator is not associative");
				}
			}
		}
	};


	// utilities

	function sanitizeToken(token, id, stateName){
		var t = {
					id:     id,
					left:   token.left,
					right:  token.right,
					state:  stateName,
					next:   token.next || stateName,
					direct: token.direct
				},
			p = token.pattern;
		if(p instanceof RegExp){
			t.pattern = new RegExp("^(" + p.source + ")",
					(p.global ? "g" : "") +
					(p.ignoreCase ? "i" : "") +
					(p.multiline ? "m" : "")
				);
		}else{
			t.pattern = new RegExp("^(" + toRegExpSource(p && typeof p == "string" ? p : id) + ")")
		}
		return t;
	}

	function toRegExpSource(s){
		if(/\w+/.test(s)){
			return s + "\\b";
		}
		return s.replace(/[#-.]|[[-^]|[?|{}]/g, "\\$&");
	}

	function defaultOnNoMatch(parser){
		throw Error("Cannot match an input in state: " + parser.expected);
	}

	function prepareState(state, stateName){
		var matchers = [], tokens = [];
		// 1st pass: plain string matchers
		for(var id in state){
			var token = state[id];
			if(typeof token == "object" && !(token.pattern instanceof RegExp)){
				token = sanitizeToken(token, id, stateName);
				matchers.push(token.pattern);
				tokens.push(token);
			}
		}
		// 2nd pass: regular expression matchers
		for(var id in state){
			var token = state[id];
			if(typeof token == "object" && token.pattern instanceof RegExp){
				token = sanitizeToken(token, id, stateName);
				matchers.push(token.pattern);
				tokens.push(token);
			}
		}
		// form a state
		return {
			matchers:  matchers,
			tokens:    tokens,
			onNoMatch: state.onNoMatch || defaultOnNoMatch
		};
	}


	// exports

	return Parser;
});
