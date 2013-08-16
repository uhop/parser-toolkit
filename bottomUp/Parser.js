/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function(){
	"use strict";

	var consumeReadyState = {consume: 1, bracket: 1, eos: 1},
		eoi = {id: "End of Input", left: -1, right: -1};

	function Parser(grammar, name){
		this.reset(grammar, name);
	}

	Parser.prototype = {
		reset: function(grammar, name){
			this.stack    = [];
			this.state    = "supply";
			this.grammar  = grammar;
			this.expected = name || "main";
		},
		_consume: function(){
			if(this.state == "eos"){
				this.state = "done";
				return this.token;
			}
			//assert((this.state in consumeReadyState) && this.stack.length);
			var token = this.stack.pop();
			if(this.state == "consume"){
				this._decide();
			}else{
				//assert(this.state == "bracket");
				this.stack.push(this.token);
				this.state = "supply";
			}
			return token;
		},
		_decide: function(token){
			if(token){
				//assert(this.state == "supply");
				this.token = token;
			}

			var left  = this.token.left,
				right = this.stack.length ? this.stack[this.stack.length - 1].right : 0;

			if(left > right){
				this.expected = this.token.next;
				this.stack.push(this.token);
				this.state = "supply";
			}else if(left < right){
				this.state = this.stack.length ? "consume" : "eos";
			}else{
				if(this.stack.length){
					if(this.grammar.brackets[this.stack[this.stack.length - 1].value] === this.token.value){
						this.state = "bracket";
						return;
					}
				}
				throw Error("Unbalanced brackets or an operator is not associative: " + this.token.id);
			}
		},
		getExpectedState: function(){
			return this.state == "done" ? null : this.grammar[this.expected];
		},
		putToken: function(token, scanner){
			if(token){
				if(!token.ignore){
					//assert(this.state == "supply");
					this._decide(token);
					while(this.state in consumeReadyState){
						token = this._consume();
						if(token !== eoi){
							this.onToken(token);
						}
					}
				}
			}else{
				this.putToken(eoi, scanner);
				if(this.state != "done"){
					throw Error("Can't find a legal token" +
						(scanner ? " at (" + scanner.line + ", " + scanner.pos + ") in: " +
							(scanner.buffer.length > 16 ? scanner.buffer.substring(0, 16) + "..." :
								scanner.buffer) + "\n" : ".\n") +
						"Tried '" + this.expected + "': " +
						this.grammar[this.expected].tokens.map(function(token){
							return "'" + token.id + "'";
						}).join(", ") + ".");
				}
			}
		},
		onToken: function(token){
			console.log(token.id + " (" + token.line + ", " + token.pos + "): " + token.value);
		}
	};

	return Parser;
});
