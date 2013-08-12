/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function(){
	"use strict";

	function Parser(rule){
		this.reset(rule);
	}

	Parser.prototype = {
		reset: function(rule){
			this.expected = null;
			this.triedTokens = [];
			this.arrayStack = [rule];
			this.indexStack = [0];
		},
		getExpectedState: function(){
			for(;;){
				if(!this.arrayStack.length){
					return null;
				}
				var a = this.arrayStack.pop(),
					i = this.indexStack.pop();
				if(i < a.length){
					var value = a[i++];
					this.arrayStack.push(a);
					this.indexStack.push(i);
					return this.expected = value;
				}
				if(a.repeatable){
					this.arrayStack.push(a);
					this.indexStack.push(0);
				}
			}
		},
		putToken: function(token, scanner){
			if(token === false){
				token = null;
			}
			if(token === null){
				// no match: save failed tokens
				this.triedTokens.push.apply(this.triedTokens, this.expected.tokens);
				// check optional items
				if(this.expected.optional){
					return;
				}
				var a = this.arrayStack.pop(),
					i = this.indexStack.pop();
				if(a.optional && i === 1){
					return;
				}
				throw Error("Can't find a legal token" +
						(scanner ? " at (" + scanner.line + ", " + scanner.pos + ") in: " +
							scanner.buffer.substring(0, 16) +
							(scanner.buffer.length > 16 ? "..." : "") + ".\n" : ". ") +
						"Tried: " +
						this.triedTokens.map(function(token){
							return "'" + token.id + "'";
						}).join(", ") + ".");
			}
			this.arrayStack.push.apply(this.arrayStack, token.nextArray);
			this.indexStack.push.apply(this.indexStack, token.nextIndex);
			if(this.triedTokens.length){
				this.triedTokens = [];
			}
			this.onToken(token);
		},
		onToken: function(token){
			//console.log(token.id + " (" + token.line + ", " + token.pos + "): " + token.value);
		}
	};

	return Parser;
});
