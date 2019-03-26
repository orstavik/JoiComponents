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
        type: "function",
        name: "calc",
        children: [{
          type: "operation",
          left: {type: "number", unit: "px", value: "3"},
          operator: "+",
          right: {
            type: "operation",
            left: {type: "number", unit: "%", value: "3"},
            operator: "-",
            right: {type: "number", unit: "em", value: "3"}
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
    expect(() => parseCssValue("calc(5px +5%)")).to.throw(SyntaxError,
      "Illegal CSS value expression list:\n  calc(5px +5%)\n           ^");
  });

  it("operation lacking space 3: calc(6px- 6%)", function () {
    expect(() => parseCssValue("calc(6px- 6%)")).to.throw(SyntaxError,
      "Illegal CSS value expression list:\n  calc(6px- 6%)\n            ^");
  });

  it("operation lacking space 4: calc(var(--custom-prop)/ 2)", function () {
    expect(() => parseCssValue("calc(var(--custom-prop)/2)")).to.throw(SyntaxError,
      "Illegal CSS value expression list:\n  calc(var(--custom-prop)/2)\n                         ^");
  });

  it("operation lacking several spaces 5: calc( calc( 100px +2)- 2)", function () {
    expect(() => parseCssValue("calc( calc( 100px +2)- 2)")).to.throw(SyntaxError,
      "Illegal CSS value expression list:\n  calc( calc( 100px +2)- 2)\n                    ^");
  });

  it("operation lacking operator 1: calc(6px 6%)", function () {
    expect(() => parseCssValue("calc(6px 6%)")).to.throw(SyntaxError,
      "Illegal CSS value expression list:\n  calc(6px 6%)\n           ^");
  });

  it("lack of space is not confused with a minus number 1: calc(-10px+ -6vw)", function () {
    expect(() => parseCssValue("calc(-10px+ -6vw)")).to.throw(SyntaxError,
      "Illegal CSS value expression list:\n  calc(-10px+ -6vw)\n            ^");
  });

  it("lack of space is not confused with a minus number 2: calc(-20vh +-8%)", function () {
    expect(() => parseCssValue("calc(-20vh +-8%)")).to.throw(SyntaxError,
      "Css value operator must be surrounded by space:\n  calc(-20vh +-8%)\n              ^");
  });

  it("lack of space is not confused with a minus number 3: calc(-6px+-6%)", function () {
    expect(() => parseCssValue("calc(-6px+-6%)")).to.throw(SyntaxError,
      "Illegal CSS value expression list:\n  calc(-6px+-6%)\n           ^");
  });

  it("Illegal token 1: rotate(4deg]", function () {
    expect(() => parseCssValue("rotate(4deg]")).to.throw(SyntaxError,
      "Illegal token: \n  rotate(4deg]\n             ^");
  });

  it("Illegal token 2: rotate[4deg)", function () {
    expect(() => parseCssValue("rotate[4deg)")).to.throw(SyntaxError,
      "Illegal token: \n  rotate[4deg)\n        ^");
  });

  it("Illegal color 1: # 1", function () {
    expect(() => parseCssValue("# 1")).to.throw(SyntaxError,
      "Illegal token: \n  # 1\n  ^");
  });

  it("Illegal color 2: #1", function () {
    expect(() => parseCssValue("#1")).to.throw(SyntaxError,
      "Illegal #color: \n  #1\n  ^");
  });

  it("Illegal color 3: #12", function () {
    expect(() => parseCssValue("#12")).to.throw(SyntaxError,
      "Illegal #color: \n  #12\n  ^");
  });

  it("Illegal color 4: #12345", function () {
    expect(() => parseCssValue("#12345")).to.throw(SyntaxError,
      "Illegal #color: \n  #12345\n  ^");
  });

  it("Illegal color 5: #12345", function () {
    expect(() => parseCssValue("#12345")).to.throw(SyntaxError,
      "Illegal #color: \n  #12345\n  ^");
  });

  it("Illegal color 6: #1234567", function () {
    expect(() => parseCssValue("#1234567")).to.throw(SyntaxError,
      "Illegal #color: \n  #1234567\n  ^");
  });

  it("Illegal CSS primitive value 1: 21as 9,7))", function () {
    expect(() => parseCssValue("21as 9,7))")).to.throw(SyntaxError,
      "Illegal CSS primitive value: \n  21as 9,7))\n          ^");
  });
});
