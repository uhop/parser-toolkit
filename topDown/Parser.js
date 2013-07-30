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
			for(;;){
				if(!this.arrayStack.length){
					return null;
				}
				var a = this.arrayStack.pop(),
					i = this.indexStack.pop();
				if(i === a.length){
					if(a.onEnd){
						a.onEnd(this);
					}
					continue;
				}
				var val = a[i];
				this.arrayStack.push(a);
				this.indexStack.push(i + 1);
				if(val instanceof Array){
					this.arrayStack.push(val);
					this.indexStack.push(0);
					continue;
				}
				// val is a state
				break;
			}
			this.expected = val;
			return val;
		},
		putToken: function(token){
			if(token === null){
				if(this.expected.onFail){
					this.expected.onFail(this);
					return;
				}
				throw Error("Can't find expected token. Expected: " +
					this.expected.tokens.map(function(item){ return item.id; }).join(", "));
			}
			// update the next position, if applicable
			if(token.arrayStack){
				// skip arrays
				this.arrayStack.push.apply(this.arrayStack, token.arrayStack);
				this.indexStack.push.apply(this.indexStack, token.indexStack);
			}
			// do something token-specific
			console.log(token.id, " : ", token.value);
		}
	};

	return Parser;
});
