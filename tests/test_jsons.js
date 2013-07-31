var Scanner = require("../Scanner");
var Parser  = require("../topDown/Parser");

var json = require("./json");

var fs = require("fs");


var scanner = new Scanner(),
	parser = new Parser(json.value),
	ws = new Parser(json.ws).getExpectedState();


fs.readFile("./sample.json", {encoding: "utf8"}, function(err, data){
	if(err){
		throw err;
	}

	// let's process the whole file
	scanner.addBuffer(data, true);

	// now let's loop over tokens
	for(;;){
		scanner.getToken(ws); // skip whitespace
		var expected = parser.getExpectedState();
		if(!expected){
			// we are done
			break;
		}
		var token = scanner.getToken(expected);
		if(token === true){
			throw Error("Scanner requests more data, which should be impossible.");
		}
		parser.putToken(token);
	}

	if(!scanner.isFinished()){
		throw Error("Error: scanner has some unprocessed symbols.");
	}
});
