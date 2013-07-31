/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function(){
	"use strict";

	function Parser(array, index){
		this.reset(array, index);
	}

	Parser.prototype = {
		reset: function(array, index){
			this.expected = null;
			if(array){
				this.arrayStack = [array];
				this.indexStack = [index || 0];
			}else{
				this.arrayStack = [];
				this.indexStack = [];
			}
		},
		getExpectedState: function(){
			for(var allowAny = true;;){
				if(!this.arrayStack.length){
					return null;
				}
				var a = this.arrayStack.pop(),
					i = this.indexStack.pop();
				if(!allowAny && a.any){
					// skip other alternatives, if we return successfully
					// unsuccessful returns are processed in putToken()
					continue;
				}
				if(i === a.length){
					// rule is finished
					if(a.any){
						// we have no alternatives: recalculate
						this.putToken(null);
						allowAny = true;
						continue;
					}
					if(a.repeatable){
						// restart the rule
						this.arrayStack.push(a);
						this.indexStack.push(0);
						continue;
					}
					// go up one level
					allowAny = false;
					continue;
				}
				var val = a[i];
				this.arrayStack.push(a);
				this.indexStack.push(i + 1);
				if(val instanceof Array){
					this.arrayStack.push(val);
					this.indexStack.push(0);
					allowAny = true;
					continue;
				}
				// val is a state
				break;
			}
			this.expected = val;
			return val;
		},
		putToken: function(token){
			if(token === false){
				token = null;
			}
			if(token === null){
				// no match: check alternatives and optional rules
				while(this.arrayStack.length){
					var a = this.arrayStack.pop(),
						i = this.indexStack.pop();
					if(a.any){
						if(i < a.length){
							// try next alternative
							this.arrayStack.push(a);
							this.indexStack.push(i);
							return;
						}
						continue;
					}
					if(a.optional){
						if(i === 1){
							// skip the rest, go up one level
							return;
						}
						break;
					}
					// regular rule
					if(i === 1){
						continue;
					}
					break;
				}
				throw Error("Can't find expected token.");
			}
			// found match: skip the rest of alternatives
			while(this.arrayStack.length && this.arrayStack[this.arrayStack.length - 1].any){
				this.arrayStack.pop(),
				this.indexStack.pop();
			}
			// do something token-specific
			console.log(token.id + " (" + token.line + ", " + token.pos + "): " + token.value);
		}
	};

	return Parser;
});
