import {parseCssValue} from "../../../src/style/CssValueParser.js";

describe("Parser correct", function () {
  it("words: red blue", function () {
    const ast = parseCssValue("red blue");
    expect(ast).to.deep.equal([[
      {type: "word", value: "red"},
      {type: "word", value: "blue"}
    ]]);
  });

  it("comma: red, blue", function () {
    const ast = parseCssValue("red, blue");
    expect(ast).to.deep.equal([
      [{type: "word", value: "red"}],
      [{type: "word", value: "blue"}]
    ]);
  });

  it("empty comma list: blue,, red", function () {
    const ast = parseCssValue("blue,, red");
    expect(ast).to.deep.equal(
      [[{"type": "word", "value": "blue"}], [], [{"type": "word", "value": "red"}]]
    );
  });

  it("number: 10px +.2e-23 50%", function () {
    const ast = parseCssValue("10px +.2e-23 50%");
    expect(ast).to.deep.equal([[
      {type: "number", unit: "px", value: "10"},
      {type: "number", value: "+.2e-23"},
      {type: "number", unit: "%", value: "50"}
    ]]);
  });

  it("expression: calc(10px + 20%)", function () {
    const ast = parseCssValue("calc(10px + 20%)");
    expect(ast).to.deep.equal([[
      {
        type: "function",
        name: "calc",
        children: [{
          type: "operation",
          left: {type: "number", unit: "px", value: "10"},
          operator: "+",
          right: {type: "number", unit: "%", value: "20"}
        }]
      }
    ]]);
  });

  it("expression: calc(3px + 3% - 3em)", function () {
    const ast = parseCssValue("calc(3px + 3% - 3em)");
    expect(ast).to.deep.equal(
      [[{
        "type": "function",
        "name": "calc",
        "children": [{
          "type": "operation",
          "left": {"type": "number", "unit": "px", "value": "3"},
          "operator": "+",
          "right": {
            "type": "operation",
            "left": {"type": "number", "unit": "%", "value": "3"},
            "operator": "-",
            "right": {"type": "number", "unit": "em", "value": "3"}
          }
        }]
      }]]
    );
  });
});

describe("Parser error", function () {
  it("operation lacking space 1: calc(4px+4%)", function () {
    expect(() => parseCssValue("calc(4px+4%)")).to.throw(SyntaxError,
      "Illegal CSS value expression list:\n  calc(4px+4%)\n          ^");
  });

  it("operation lacking space 2: calc(5px +5%)", function () {
    const ast = parseCssValue("calc(5px +5%)");
    expect(ast).to.deep.equal(

    );
  });

  it("operation lacking space 3: calc(6px+ 6%)", function () {
    const ast = parseCssValue("calc(6px+ 6%)");
    expect(ast).to.deep.equal(

    );
  });
});
