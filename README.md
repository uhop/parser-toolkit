# parser-toolkit [![Build Status](https://secure.travis-ci.org/uhop/parser-toolkit.png?branch=master)](http://travis-ci.org/uhop/parser-toolkit)

parser-toolkit is a collection of scanner and parser components, which allows fast creation of efficient parser for custom languages. The main point of a toolkit is to support streamable chunked input.

A standard-compiant implementation of JSON is included as a test. This is how JSON is defined:

```js
var ws = {id: "ws", pattern: /\s+/},
    // numeric tokens
    nonZero      = {id: "nonZero",      pattern: /[1-9]/},
    exponent     = {id: "exponent",     pattern: /[eE]/},
    numericChunk = {id: "numericChunk", pattern: /\d{1,256}/},
    // string tokens
    plainChunk   = {id: "plainChunk",   pattern: /[^\"\\]{1,256}/},
    escapedChars = {id: "escapedChars", pattern: /\\(?:[bfnrt\"\\\/]|u[0-9a-fA-F]{4})/};

var json = new Grammar();

json.addRule("ws", ws);

json.addRule("value",  any(rule("object"), rule("array"), rule("string"),
    rule("number"), ["-", rule("number")], "true", "false", "null"));
json.addRule("object", ["{", maybe(rule("pair"), repeat(",", rule("pair"))), "}"]);
json.addRule("pair",   [rule("string"), ":", rule("value")]);
json.addRule("array",  ["[", maybe(rule("value"), repeat(",", rule("value"))), "]"]);
json.addRule("string", ["\"", repeat(any(plainChunk, escapedChars)), "\""]);
json.addRule("number", [any("0", [nonZero, repeat(numericChunk)]),
    maybe(".", repeat(numericChunk)),
    maybe(exponent, maybe(maybe(any("-", "+")), repeat(numericChunk)))
]);

json.generate();
```

The whole definition is taken verbatim from [JSON.org](http://json.org/).

The test file `sample.json` is copied as is from an open source project [json-simple](https://code.google.com/p/json-simple/) under Apache License 2.0.