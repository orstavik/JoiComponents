import {parseCssValue} from "../../../src/style/CssValueParser.js";

describe("Parser correct", function () {
  it("words: red blue", function () {
    const ast = parseCssValue("red blue");
    expect(ast).to.deep.equal([[
      {type: "word", value: "red"},
      {type: "word", value: "blue"}
    ]]);
  });

  it("units: 1em 1ex 1ch 1cm 1rem", function () {
    const ast = parseCssValue("1em 1ex 1ch 1cm 1rem");
    expect(ast).to.deep.equal([[
      {type: "number", unit: "em", value: "1"},
      {type: "number", unit: "ex", value: "1"},
      {type: "number", unit: "ch", value: "1"},
      {type: "number", unit: "cm", value: "1"},
      {type: "number", unit: "rem", value: "1"}
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
  
  it("angle units: rotate(10deg)", function () {
    const deg = parseCssValue("rotate(10deg)");
    expect(deg).to.deep.equal(
      [[{
        children: [{
          type: "number",
          unit: "deg",
          value: "10"
        }],
        name: "rotate",
        type: "function"
      }]]);
  });

  it("number: 10px +.2e-23 50%", function () {
    const ast = parseCssValue("10px +.2e-23 50%");
    expect(ast).to.deep.equal([[
      {type: "number", unit: "px", value: "10"},
      {type: "number", value: "+.2e-23"},
      {type: "number", unit: "%", value: "50"}
    ]]);
  });

  it("number: 10", function () {
    const ast = parseCssValue("10");
    expect(ast).to.deep.equal([[
      {type: "number", value: "10"},
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
  
   it("rgb color missed space: rgb(255.5,0.5,0.3)", function () {
    const color = parseCssValue("rgb(255.5,0.5,0.3)");
    expect(color).to.deep.equal(
      [[{
        children: [{
          type: "number",
          value: "255.5"
        },
          {
            type: "number",
            value: "0.5"
          },
          {
            type: "number",
            value: "0.3"
          }],
        type: "function",
        name: "rgb",
      }]]);
  });

  it("url parsing 1: url('abcd.png')", function () {
    const color = parseCssValue("url('abcd.png')");
    expect(color).to.deep.equal(
      [[{
        children: [{
          text: "abcd.png",
          type: "quote",
          value: "'abcd.png'"
        }],
        name: "url",
        type: "function"
      }]]);
  });

  it("url parsing 2: url('./abc/def.png')", function () {
    const color = parseCssValue("url('./abc/def.png')");
    expect(color).to.deep.equal(
      [[{
        children: [{
          text: "./abc/def.png",
          type: "quote",
          value: "'./abc/def.png'"
        }],
        name: "url",
        type: "function"
      }]]);
  });

  it("url parsing 3: url('http://mysite.example.com/mycursor.png')", function () {
    const color = parseCssValue("url('http://mysite.example.com/mycursor.png')");
    expect(color).to.deep.equal(
      [[{
        children: [{
          text: "http://mysite.example.com/mycursor.png",
          type: "quote",
          value: "'http://mysite.example.com/mycursor.png'"
        }],
        name: "url",
        type: "function"
      }]]);
  });
});

describe("Colors", function () {

  it("hash colors 3 characters 1: #123", function () {
    const color = parseCssValue("#123");
    expect(color).to.deep.equal(
      [[{type: '#', value: '123'}]]
    );
  });

  it("hash colors 3 characters 2: #abc", function () {
    const color = parseCssValue("#f09");
    expect(color).to.deep.equal(
      [[{type: '#', value: 'f09'}]]
    );
  });


  it("hash colors 3 characters 3: #12b", function () {
    const color = parseCssValue("#12b");
    expect(color).to.deep.equal(
      [[{type: '#', value: '12b'}]]
    );
  });

  it("hash colors 6 characters 1: #123456", function () {
    const color = parseCssValue("#123456");
    expect(color).to.deep.equal(
      [[{type: '#', value: '123456'}]]
    );
  });

  it("hash colors 6 characters 2: #ffabcd", function () {
    const color = parseCssValue("#ffabcd");
    expect(color).to.deep.equal(
      [[{type: '#', value: 'ffabcd'}]]
    );
  });

  it("hash colors 6 characters 3: #ff0099 ", function () {
    const color = parseCssValue("#ff0099");
    expect(color).to.deep.equal(
      [[{type: '#', value: 'ff0099'}]]
    );
  });

  it("hash colors 6 characters 4: #FFFFFF", function () {
    const color = parseCssValue("#FFFFFF");
    expect(color).to.deep.equal(
      [[{type: '#', value: 'FFFFFF'}]]
    );
  });

  it("hash colors 8 characters 1: #12345678", function () {
    const color = parseCssValue("#12345678");
    expect(color).to.deep.equal(
      [[{type: '#', value: '12345678'}]]
    );
  });

  it("hash colors 8 characters 2: #fff00012", function () {
    const color = parseCssValue("#fff00012");
    expect(color).to.deep.equal(
      [[{type: '#', value: 'fff00012'}]]
    );
  });

  it("hash colors 8 characters 3: #FF0099FF", function () {
    const color = parseCssValue("#FF0099FF");
    expect(color).to.deep.equal(
      [[{type: '#', value: 'FF0099FF'}]]
    );
  });

  it("rgb color : rgb(255,0,0)", function () {
    const color = parseCssValue("rgb(255,0,0)");
    expect(color).to.deep.equal(
      [[{
        children: [{
          type: "number",
          value: "255"
        },
          {
            type: "number",
            value: "0"
          },
          {
            type: "number",
            value: "0"
          }],
        type: "function",
        name: "rgb",
      }]]);
  });

  it("rgb color decimal values: rgb(255.5, 0.5, 0.3)", function () {
    const color = parseCssValue("rgb(255.5, 0.5, 0.3)");
    expect(color).to.deep.equal(
      [[{
        children: [{
          type: "number",
          value: "255.5"
        },
          {
            type: "number",
            value: "0.5"
          },
          {
            type: "number",
            value: "0.3"
          }],
        type: "function",
        name: "rgb",
      }]]);
  });

  it("rgb color units: rgb(100.5%, 0%, 30%)", function () {
    const color = parseCssValue("rgb(100.5%, 0%, 30%)");
    expect(color).to.deep.equal(
      [[{
        children: [{
          type: "number",
          unit: "%",
          value: "100.5"
        },
          {
            type: "number",
            unit: "%",
            value: "0"
          },
          {
            type: "number",
            unit: "%",
            value: "30"
          }],
        type: "function",
        name: "rgb",
      }]]);
  });

  it("rgba color : rgba(123, 10, 20)", function () {
    const color = parseCssValue("rgba(123,10,20)");
    expect(color).to.deep.equal(
      [[{
        children: [{
          type: "number",
          value: "123"
        },
          {
            type: "number",
            value: "10"
          },
          {
            type: "number",
            value: "20"
          }],
        type: "function",
        name: "rgba",
      }]]);
  });

  it("rgba color 4 values : rgba(123, 10, 20, 30)", function () {
    const color = parseCssValue("rgba(123, 10, 20, 30)");
    expect(color).to.deep.equal(
      [[{
        children: [{
          type: "number",
          value: "123"
        },
          {
            type: "number",
            value: "10"
          },
          {
            type: "number",
            value: "20"
          },
          {
            type: "number",
            value: "30"
          }],
        type: "function",
        name: "rgba",
      }]]);
  });

  it("rgba color decimal values: rgba(312.5, 5.5, 2.3)", function () {
    const color = parseCssValue("rgba(312.5, 5.5, 2.3)");
    expect(color).to.deep.equal(
      [[{
        children: [{
          type: "number",
          value: "312.5"
        },
          {
            type: "number",
            value: "5.5"
          },
          {
            type: "number",
            value: "2.3"
          }],
        type: "function",
        name: "rgba",
      }]]);
  });

  it("rgba color units: rgba(100.5%, 20%, 30%)", function () {
    const color = parseCssValue("rgba(100.5%, 20%, 30%)");
    expect(color).to.deep.equal(
      [[{
        children: [{
          type: "number",
          unit: "%",
          value: "100.5"
        },
          {
            type: "number",
            unit: "%",
            value: "20"
          },
          {
            type: "number",
            unit: "%",
            value: "30"
          }],
        type: "function",
        name: "rgba",
      }]]);
  });

  it("hsl color : hsl(0, 100, 50)", function () {
    const color = parseCssValue("hsl(0, 100, 50)");
    expect(color).to.deep.equal(
      [[{
        children: [{
          type: "number",
          value: "0"
        },
          {
            type: "number",
            value: "100"
          },
          {
            type: "number",
            value: "50"
          }],
        type: "function",
        name: "hsl",
      }]]);
  });

  it("hsl color decimal values: hsl(2.5, 3.5, 4.3)", function () {
    const color = parseCssValue("hsl(2.5, 3.5, 4.3)");
    expect(color).to.deep.equal(
      [[{
        children: [{
          type: "number",
          value: "2.5"
        },
          {
            type: "number",
            value: "3.5"
          },
          {
            type: "number",
            value: "4.3"
          }],
        type: "function",
        name: "hsl",
      }]]);
  });

  it("hsl color units: hsl(100.5%, 0%, 30%)", function () {
    const color = parseCssValue("hsl(100.5%, 0%, 30%)");
    expect(color).to.deep.equal(
      [[{
        children: [{
          type: "number",
          unit: "%",
          value: "100.5"
        },
          {
            type: "number",
            unit: "%",
            value: "0"
          },
          {
            type: "number",
            unit: "%",
            value: "30"
          }],
        type: "function",
        name: "hsl",
      }]]);
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
