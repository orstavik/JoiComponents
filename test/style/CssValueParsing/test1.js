import {CssValueTokenizer, parseCssValue} from "../../../src/style/CssValueParser.js";

function tokensToArray(tokens) {
  const res = [];
  for (let t; t = tokens.next();)
    res.push(t);
  return res;
}

/*
  var test2 = "#00ff00 #FFFFFF #FF0099FF #123456 #f09 #ff0099";
  var test3 = "yellow blue transparent skyblue ghostwhite whitesmoke";
  var test4 = "rgba(0, 0, -255, 0.5) rgb(100%, 0%, 0%) rgba(100%, 0%, 0%, 1) hsl(0, 100%, 50%) hsl(120, 100%, 50%) hsla(240, 100%, 50%, 0.5)";
  var test5 = 'url("./abcd.png") url("http://mysite.example.com/mycursor.png") url("./abc/def.png") ';
  var test6 = "rotate3d(1, -1, 1, 45deg) rotate(23deg)  calc(12vw * 20%) matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -50, -100, 0, 1.1) var(--custom-prop, red)";
  var test6a =  " ";
//  var test3 = "rotate(23deg) calc(12vw * 20%), var(--custom-prop), url('https://wow.com/img.jpg?size=12,24,,,')";
//  var test4 = " +20px -12.20px .5e-125 sugarwhite";
  // WRONG
  var test7 = "#00f red-blue #1234567890 #red ";
  var test8 = "rgba(0,0,255,0.5 rgb(123, 100 100) rgba(100%0%0%1) hsl(120, 100%, 25% hsl(120100%25%) hsl(120  100%,  25%) ";
  var test9 = 'url(abcdef.png") url("http://mysite.example.com/mycursor.png" url(".abc / def") ';

hashcolors
functions
quotes
operators (all of them)
longer spaces
words with -_-_

errors,
wrong quotes
wrong hashcolors (should be tokenized)



  */

describe('Tokenizer', function () {

  it("words: red blue", function () {
    const tokens = new CssValueTokenizer("red blue");
    const tokensRes = tokensToArray(tokens);
    expect(tokensRes).to.deep.equal([
      ["red", undefined, undefined, undefined, "red", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["blue", undefined, undefined, undefined, "blue", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
    ]);
  });

  it("numbers: -124px +3.5px 100 +2.1vw -.4px -4.5 1.2 .3 .5e-125 34%", function () {
    const tokens = new CssValueTokenizer("-124px +3.5px 100 +2.1vw -.4px -4.5 1.2 .3 .5e-125 5e12 34%");
    const tokensRes = tokensToArray(tokens);
    expect(tokensRes).to.deep.equal([
      ["-124", undefined, "-124", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["px", undefined, undefined, undefined, "px", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["+3.5", undefined, "+3.5", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["px", undefined, undefined, undefined, "px", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["100", undefined, "100", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["+2.1", undefined, "+2.1", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["vw", undefined, undefined, undefined, "vw", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["-.4", undefined, "-.4", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["px", undefined, undefined, undefined, "px", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["-4.5", undefined, "-4.5", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["1.2", undefined, "1.2", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [".3", undefined, ".3", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [".5e-125", undefined, ".5e-125", "e-125", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["5e12", undefined, "5e12", "e12", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["34", undefined, "34", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["%", undefined, undefined, undefined, undefined, undefined, "%", undefined, undefined, undefined, undefined, undefined],
    ]);
  });
});

//todo wait making more of this until we have the tokenizer and the strategy for making the wrapper of the CSSValue class
function astToObject(ast) {
  return ast.map(row => row.map(value => value.getValue()));
}

describe("Parser", function () {
  it("words: red blue", function () {
    const ast = parseCssValue("red blue");
    const res = astToObject(ast);
    expect(res).to.deep.equal([
      ["red", "blue"]
    ]);
  });
});