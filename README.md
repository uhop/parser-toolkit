# parser-toolkit [![Build Status](https://secure.travis-ci.org/uhop/parser-toolkit.png?branch=master)](http://travis-ci.org/uhop/parser-toolkit)

parser-toolkit is a collection of scanner and parser components, which allows fast creation of efficient parser for custom languages. The main point of a toolkit is to support streamable chunked input.

A standard-compiant implementation of JSON is included as a test. This is how JSON is defined:

```js
var ws           = {id: "ws",           pattern: /\s{1,256}/},
    // numeric tokens
    nonZero      = {id: "nonZero",      pattern: /[1-9]/},
    exponent     = {id: "exponent",     pattern: /[eE]/},
    numericChunk = {id: "numericChunk", pattern: /\d{1,256}/},
    // string tokens
    plainChunk   = {id: "plainChunk",   pattern: /[^\"\\]{1,256}/},
    escapedChars = {id: "escapedChars",
        pattern: /\\(?:[bfnrt\"\\\/]|u[0-9a-fA-F]{4})/};

var json = new Grammar({
    main:   [rule("ws"), rule("value")],
    ws:     repeat(ws),
    value:  [
        any(rule("object"), rule("array"), rule("string"),
            rule("number"), ["-", rule("number")],
            "true", "false", "null"),
        rule("ws")
    ],
    object: [
        "{",
            rule("ws"),
            maybe(rule("pair"),
                repeat(",", rule("ws"), rule("pair"))),
        "}"
    ],
    pair:   [
        rule("string"), rule("ws"), ":", rule("ws"), rule("value")
    ],
    array:  [
        "[",
            rule("ws"),
            maybe(rule("value"),
                repeat(",", rule("ws"), rule("value"))),
        "]"
    ],
    string: ["\"", repeat(any(plainChunk, escapedChars)), "\""],
    number: [
        any("0", [nonZero, repeat(numericChunk)]),
        maybe(".", repeat(numericChunk)),
        maybe(exponent, maybe(any("-", "+")),
            numericChunk, repeat(numericChunk))
    ]
});
```

The whole definition is taken verbatim from [JSON.org](http://json.org/).

The test file `sample.json` is copied as is from an open source project [json-simple](https://code.google.com/p/json-simple/) under Apache License 2.0.