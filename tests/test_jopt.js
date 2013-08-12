var Scanner  = require("../Scanner2");
var Parser   = require("../topDown/Parser2");
var optimize = require("../topDown/optimize");

var json = require("./json");


optimize(json);

var scanner = new Scanner();

scanner.addBuffer("[0, 1, 0.2, 1e2, 1.2E3, 1.2e-3, 1.2e+34, " +
	"[], [-0, -1, -0.2, -1e2, -1.2E3, -1.2e-3, -1.2e+34], " +
	"true, false, null, \"I say: \\\"Hey!\\\"\", " +
	"{}, {\"a\": 2}, {\"b\": true, \"c\": {}}]", true);

//scanner.addBuffer("1e2", true);
//scanner.addBuffer("[1,2,3]", true);
//scanner.addBuffer("[[], [true], true]", true);
//scanner.addBuffer("[[[]]]", true);

var parser = new Parser(json.main);

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
	throw Error("Unprocessed symbols: " + scanner.buffer.substring(0, 16) +
		(scanner.buffer.length > 16 ? "..." : ""));
}
