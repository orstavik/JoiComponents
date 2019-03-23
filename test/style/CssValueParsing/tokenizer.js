import {CssValueTokenizer} from "../../../src/style/CssValueParser.js";

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
  var test6 = "matrix3d(12,12) rotate3d(1, -1, 1, 45deg) rotate(23deg)  calc(12vw * 20%) matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -50, -100, 0, 1.1) var(--custom-prop, red)";
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
  
 it("colors: yellow blue transparent skyblue ghostwhite whitesmoke", function () {
    const tokens = new CssValueTokenizer("yellow blue transparent skyblue ghostwhite whitesmoke");
    const tokensRes = tokensToArray(tokens);
    expect(tokensRes).to.deep.equal([
      ["yellow", undefined, undefined, undefined, "yellow", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["blue", undefined, undefined, undefined, "blue", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["transparent", undefined, undefined, undefined, "transparent", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["skyblue", undefined, undefined, undefined, "skyblue", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["ghostwhite", undefined, undefined, undefined, "ghostwhite", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["whitesmoke", undefined, undefined, undefined, "whitesmoke", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
    ]);
  });

  it("colors: rgba(0, 0, -255, 0.5) rgb(100%, 0%, 0%) rgba(100%, 0%, 0%, 1) hsl(0, 100%, 50%) hsl(120, 100%, 50%) hsla(240, 100%, 50%, 0.5)", function () {
    const tokens = new CssValueTokenizer("rgba(0, 0, -255, 0.5) rgb(100%, 0%, 0%) rgba(100%, 0%, 0%, 1) hsl(0, 100%, 50%) hsl(120, 100%, 50%) hsla(240, 100%, 50%, 0.5)");
    const tokensRes = tokensToArray(tokens);
    expect(tokensRes).to.deep.equal([
      ["rgba", undefined, undefined, undefined, "rgba", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["(", undefined, undefined, undefined, undefined, undefined, "(", undefined, undefined, undefined, undefined, undefined],
      ["0", undefined, "0", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["0", undefined, "0", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["-255", undefined, "-255", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["0.5", undefined, "0.5", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [")", undefined, undefined, undefined, undefined, undefined, ")", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["rgb", undefined, undefined, undefined, "rgb", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["(", undefined, undefined, undefined, undefined, undefined, "(", undefined, undefined, undefined, undefined, undefined],
      ["100", undefined, "100", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["%", undefined, undefined, undefined, undefined, undefined, "%", undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["0", undefined, "0", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["%", undefined, undefined, undefined, undefined, undefined, "%", undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["0", undefined, "0", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["%", undefined, undefined, undefined, undefined, undefined, "%", undefined, undefined, undefined, undefined, undefined],
      [")", undefined, undefined, undefined, undefined, undefined, ")", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["rgba", undefined, undefined, undefined, "rgba", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["(", undefined, undefined, undefined, undefined, undefined, "(", undefined, undefined, undefined, undefined, undefined],
      ["100", undefined, "100", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["%", undefined, undefined, undefined, undefined, undefined, "%", undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["0", undefined, "0", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["%", undefined, undefined, undefined, undefined, undefined, "%", undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["0", undefined, "0", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["%", undefined, undefined, undefined, undefined, undefined, "%", undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["1", undefined, "1", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [")", undefined, undefined, undefined, undefined, undefined, ")", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["hsl", undefined, undefined, undefined, "hsl", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["(", undefined, undefined, undefined, undefined, undefined, "(", undefined, undefined, undefined, undefined, undefined],
      ["0", undefined, "0", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["100", undefined, "100", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["%", undefined, undefined, undefined, undefined, undefined, "%", undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["50", undefined, "50", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["%", undefined, undefined, undefined, undefined, undefined, "%", undefined, undefined, undefined, undefined, undefined],
      [")", undefined, undefined, undefined, undefined, undefined, ")", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["hsl", undefined, undefined, undefined, "hsl", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["(", undefined, undefined, undefined, undefined, undefined, "(", undefined, undefined, undefined, undefined, undefined],
      ["120", undefined, "120", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["100", undefined, "100", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["%", undefined, undefined, undefined, undefined, undefined, "%", undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["50", undefined, "50", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["%", undefined, undefined, undefined, undefined, undefined, "%", undefined, undefined, undefined, undefined, undefined],
      [")", undefined, undefined, undefined, undefined, undefined, ")", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["hsla", undefined, undefined, undefined, "hsla", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["(", undefined, undefined, undefined, undefined, undefined, "(", undefined, undefined, undefined, undefined, undefined],
      ["240", undefined, "240", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["100", undefined, "100", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["%", undefined, undefined, undefined, undefined, undefined, "%", undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["50", undefined, "50", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["%", undefined, undefined, undefined, undefined, undefined, "%", undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["0.5", undefined, "0.5", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [")", undefined, undefined, undefined, undefined, undefined, ")", undefined, undefined, undefined, undefined, undefined],
    ]);
  });

  it("url: url('./abcd.png')", function () {
    const tokens = new CssValueTokenizer("url('./abcd.png')");
    const tokensRes = tokensToArray(tokens);
    expect(tokensRes).to.deep.equal([
      ["url", undefined, undefined, undefined, "url", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["(", undefined, undefined, undefined, undefined, undefined, "(", undefined, undefined, undefined, undefined, undefined],
      ["'./abcd.png'", undefined, undefined, undefined, undefined, undefined, undefined, "./abcd.png", "g", undefined, undefined, undefined],
      [")", undefined, undefined, undefined, undefined, undefined, ")", undefined, undefined, undefined, undefined, undefined],
    ]);
  });

  it('url: url("./abcd.png")', function () {
    const tokens = new CssValueTokenizer('url("./abcd.png")');
    const tokensRes = tokensToArray(tokens);
    expect(tokensRes).to.deep.equal([
      ["url", undefined, undefined, undefined, "url", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["(", undefined, undefined, undefined, undefined, undefined, "(", undefined, undefined, undefined, undefined, undefined],
      ['"./abcd.png"', undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, "./abcd.png", "g", undefined],
      [")", undefined, undefined, undefined, undefined, undefined, ")", undefined, undefined, undefined, undefined, undefined],
    ]);
  });

  it("url: url('http://mysite.example.com/mycursor.png')", function () {
    const tokens = new CssValueTokenizer("url('http://mysite.example.com/mycursor.png')");
    const tokensRes = tokensToArray(tokens);
    expect(tokensRes).to.deep.equal([
      ["url", undefined, undefined, undefined, "url", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["(", undefined, undefined, undefined, undefined, undefined, "(", undefined, undefined, undefined, undefined, undefined],
      ["'http://mysite.example.com/mycursor.png'", undefined, undefined, undefined, undefined, undefined, undefined, "http://mysite.example.com/mycursor.png", "g", undefined, undefined, undefined],
      [")", undefined, undefined, undefined, undefined, undefined, ")", undefined, undefined, undefined, undefined, undefined],
    ]);
  });

  it("url: url('./abc/def.png')", function () {
    const tokens = new CssValueTokenizer("url('./abc/def.png')");
    const tokensRes = tokensToArray(tokens);
    expect(tokensRes).to.deep.equal([
      ["url", undefined, undefined, undefined, "url", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["(", undefined, undefined, undefined, undefined, undefined, "(", undefined, undefined, undefined, undefined, undefined],
      ["'./abc/def.png'", undefined, undefined, undefined, undefined, undefined, undefined, "./abc/def.png", "g", undefined, undefined, undefined],
      [")", undefined, undefined, undefined, undefined, undefined, ")", undefined, undefined, undefined, undefined, undefined],
    ]);
  });

  it("number or word: -3e3", function () {
    const tokens = new CssValueTokenizer("-3e3");
    const tokensRes = tokensToArray(tokens);
    expect(tokensRes).to.deep.equal([["-3e3",undefined,"-3e3","e3",undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined]]);
  });

  it("Css functions: rotate3d(1, -1, 1, 45deg) rotate(23deg)  calc(12vw * 20%) matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -50, -100, 0, 1.1) var(--custom-prop, red))", function () {
    const tokens = new CssValueTokenizer("rotate3d(1, -1, 1, 45deg) rotate(23deg)  calc(12vw * 20%) matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -50, -100, 0, 1.1) var(--custom-prop, red)");
    const tokensRes = tokensToArray(tokens);

    expect(tokensRes).to.deep.equal([
      ["rotate3d", undefined, undefined, undefined, "rotate3d", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["(", undefined, undefined, undefined, undefined, undefined, "(", undefined, undefined, undefined, undefined, undefined],
      ["1", undefined, "1", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["-1", undefined, "-1", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["1", undefined, "1", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["45", undefined, "45", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["deg", undefined, undefined, undefined, "deg", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [")", undefined, undefined, undefined, undefined, undefined, ")", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["rotate", undefined, undefined, undefined, "rotate", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["(", undefined, undefined, undefined, undefined, undefined, "(", undefined, undefined, undefined, undefined, undefined],
      ["23", undefined, "23", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["deg", undefined, undefined, undefined, "deg", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [")", undefined, undefined, undefined, undefined, undefined, ")", undefined, undefined, undefined, undefined, undefined],
      ["  ", "  ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["calc", undefined, undefined, undefined, "calc", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["(", undefined, undefined, undefined, undefined, undefined, "(", undefined, undefined, undefined, undefined, undefined],
      ["12", undefined, "12", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["vw", undefined, undefined, undefined, "vw", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["*", undefined, undefined, undefined, undefined, undefined, "*", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["20", undefined, "20", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["%", undefined, undefined, undefined, undefined, undefined, "%", undefined, undefined, undefined, undefined, undefined],
      [")", undefined, undefined, undefined, undefined, undefined, ")", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["matrix3d", undefined, undefined, undefined, "matrix3d", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["(", undefined, undefined, undefined, undefined, undefined, "(", undefined, undefined, undefined, undefined, undefined],
      ["1", undefined, "1", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["0", undefined, "0", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["0", undefined, "0", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["0", undefined, "0", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["0", undefined, "0", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["1", undefined, "1", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["0", undefined, "0", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["0", undefined, "0", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["0", undefined, "0", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["0", undefined, "0", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["1", undefined, "1", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["0", undefined, "0", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["-50", undefined, "-50", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["-100", undefined, "-100", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["0", undefined, "0", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["1.1", undefined, "1.1", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [")", undefined, undefined, undefined, undefined, undefined, ")", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["var", undefined, undefined, undefined, "var", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["(", undefined, undefined, undefined, undefined, undefined, "(", undefined, undefined, undefined, undefined, undefined],
      ["--custom-prop", undefined, undefined, undefined, "--custom-prop", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [",", undefined, undefined, undefined, undefined, undefined, ",", undefined, undefined, undefined, undefined, undefined],
      [" ", " ", undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      ["red", undefined, undefined, undefined, "red", undefined, undefined, undefined, undefined, undefined, undefined, undefined],
      [")", undefined, undefined, undefined, undefined, undefined, ")", undefined, undefined, undefined, undefined, undefined]
    ]);
  });
});