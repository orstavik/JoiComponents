import {parseCssValue} from "../../../src/style/CssValueParser.js";

//todo wait making more of this until we have the tokenizer and the strategy for making the wrapper of the CSSValue class
function astToValues(ast) {
  return ast.map(row => row.map(value => value.getValue()));
}

function astToTypes(ast) {
  return ast.map(row => row.map(value => value.getType()));
}

describe("Parser", function () {
  it("words: red blue", function () {
    const ast = parseCssValue("red blue");
    const res = astToValues(ast);
    expect(res).to.deep.equal([
      ["red", "blue"]
    ]);
    const res2 = astToTypes(ast);
    expect(res2).to.deep.equal([
      ["word", "word"]
    ]);
  });
});
