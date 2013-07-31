/* UMD.define */ (typeof define=="function"&&define||function(d,f,m){m={module:module,require:require};module.exports=f.apply(null,d.map(function(n){return m[n]||require(n)}))})
([], function(){
	"use strict";

	function Scanner(){
		this.reset();
	}

	Scanner.prototype = {

		// public interface

		reset: function(){
			this.buffer = "";
			this.line   = this.pos = 1;
			this.noMore = false;
		},

		addBuffer: function(buffer, noMore){
			this.buffer += buffer;
			this.noMore = noMore;
		},

		isFinished: function(){
			return this.noMore && !this.buffer.length;
		},

		padding: 16,

		// private workings

		newLinePattern: /[\u000A\u2028\u2029]|\u000D\u000A|\u000D/g,

		getToken: function(state, peek){
			var buffer = this.buffer;
			if(!buffer){
				// no input data: true/false for more data
				return !this.noMore;
			}
			var index  = -1, matched = "", m, tokens = state.tokens;
			for(var i = 0, n = tokens.length; i < n; ++i){
				m = buffer.match(tokens[i].pattern);
				if(m && m[0].length > matched.length){
					matched = m[0];
					index = i;
				}
			}
			if(index < 0){
				// no match
				return null;
			}
			if(!this.noMore && matched.length >= buffer.length - this.padding){
				// need more information
				return true;
			}
			var token   = Object.create(tokens[index]);
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
		}
	};

	return Scanner;
});
