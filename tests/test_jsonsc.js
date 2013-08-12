var Scanner = require("../Scanner");
var Parser  = require("../topDown/Parser");
//var optimize = require("../topDown/optimize");

var json = require("./json");

var fs = require("fs"), path = require("path"), zlib = require("zlib");


//optimize(json);

var scanner = new Scanner(),
	parser = new Parser(json.main);

var CHUNK_SIZE = 1024;


fs.readFile(path.resolve(__dirname, "sample.json.gz"), function(err, data){
	if(err){
		throw err;
	}
	zlib.gunzip(data, function(err, data){
		if(err){
			throw err;
		}

		function addChunk(){
			var chunk = data.slice(0, CHUNK_SIZE);
			data = data.slice(CHUNK_SIZE);
			scanner.addBuffer(chunk, !data.length);
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
			var token = getToken(expected);
			parser.putToken(token, scanner);
		}

		if(!scanner.isFinished()){
			throw Error("Error: scanner has some unprocessed symbols.");
		}
	});
});
