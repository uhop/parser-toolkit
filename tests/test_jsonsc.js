var Scanner = require("../Scanner");
var Parser  = require("../topDown/Parser");

var json = require("./json");

var fs = require("fs");


var scanner = new Scanner(),
	parser = new Parser(json.value),
	ws = new Parser(json.ws).getExpectedState();

var CHUNK_SIZE = 1024;

fs.readFile("./sample.json", {encoding: "utf8"}, function(err, data){
	if(err){
		throw err;
	}

	function addChunk(){
		var chunk = data.substring(0, CHUNK_SIZE);
		data = data.substring(CHUNK_SIZE);
		scanner.addBuffer(chunk, !data);
	}

	function getToken(state){
		for(;;){
			var token = scanner.getToken(state);
			if(token !== true){
				// no need for the next chunk yet
				break;
			}
			addChunk();
		}
		return token;
	}

	// let's loop over tokens
	for(;;){
		var expected = parser.getExpectedState();
		if(!expected){
			// we are done
			break;
		}
		getToken(ws); // skip whitespace
		var token = getToken(expected);
		parser.putToken(token);
	}

	if(!scanner.isFinished()){
		throw Error("Error: scanner has some unprocessed symbols.");
	}
});
