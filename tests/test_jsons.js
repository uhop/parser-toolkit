var Scanner = require("../Scanner");
var Parser  = require("../topDown/Parser");

var json = require("./json");

var fs = require("fs"), path = require("path");


var scanner = new Scanner(),
	parser = new Parser(json.value);


fs.readFile(path.resolve(__dirname, "sample.json"), "utf8", function(err, data){
	if(err){
		throw err;
	}

	// let's process the whole file
	scanner.addBuffer(data, true);

	// now let's loop over tokens
	for(;;){
		var expected = parser.getExpectedState();
		if(!expected){
			// we are done
			break;
		}
		var token = scanner.getToken(expected);
		if(token === true){
			throw Error("Scanner requests more data, which should be impossible.");
		}
		parser.putToken(token, scanner);
	}

	if(!scanner.isFinished()){
		throw Error("Error: scanner has some unprocessed symbols.");
	}
});
