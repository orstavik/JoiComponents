import {parseCssValue} from "../../../src/style/CssValueParser.js";

describe("Parser correct", function () {
  it("words: red blue", function () {
    const ast = parseCssValue("red blue");
    expect(ast).to.deep.equal([[
      {type: "word", value: "red"},
      {type: "word", value: "blue"}
    ]]);
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
    debugger;
  });

//   it("expression: calc(3px + 3% - 3em)", function () {
//     const ast = parseCssValue("calc(3px + 3% - 3em)");
//     const res = astToValues(ast);
//     expect(res).to.deep.equal([
//       ["red", "blue"]
//     ]);
//     const res2 = astToTypes(ast);
//     expect(res2).to.deep.equal([
//       ["word", "word"]
//     ]);
//   });
// });
//
// describe("Parser error", function () {
//   it("operation lacking space 1: calc(4px+4%)", function () {
//     const ast = parseCssValue("calc(4px+4%)");
//     const res = astToValues(ast);
//     expect(res).to.deep.equal([
//       ["red", "blue"]
//     ]);
//     const res2 = astToTypes(ast);
//     expect(res2).to.deep.equal([
//       ["word", "word"]
//     ]);
//   });
//
//   it("operation lacking space 2: calc(5px +5%)", function () {
//     const ast = parseCssValue("calc(5px +5%)");
//     const res = astToValues(ast);
//     expect(res).to.deep.equal([
//       ["red", "blue"]
//     ]);
//     const res2 = astToTypes(ast);
//     expect(res2).to.deep.equal([
//       ["word", "word"]
//     ]);
//   });
//
//   it("operation lacking space 3: calc(6px+ 6%)", function () {
//     const ast = parseCssValue("calc(6px+ 6%)");
//     const res = astToValues(ast);
//     expect(res).to.deep.equal([
//       ["red", "blue"]
//     ]);
//     const res2 = astToTypes(ast);
//     expect(res2).to.deep.equal([
//       ["word", "word"]
//     ]);
//   });
//
});
