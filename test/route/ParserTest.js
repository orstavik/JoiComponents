import {hashDotsToString, matchTags, parseHashDots, HashDotsRouteMap} from "../../src/router/HashDot.js";

describe("parseHashDot", function () {
  it("basic test: #omg.what.is.'this:!#...#'#wtf#OMG123.123", function () {

    const res = parseHashDots("#omg.what.is.'this:!#...#'#wtf#OMG123.123");

    expect(res.tags).to.deep.equal(["#omg", "#wtf", "#OMG123"]);
    expect(res.map).to.deep.equal({
      "#omg": [".what", ".is", ".'this:!#...#'"],
      "#wtf": [],
      "#OMG123": [".123"],
    });
  });

  it("parameter: #omg:what", function () {
    const res = parseHashDots("#omg:what");
    expect(res.tags).to.deep.equal(["#omg"]);
    expect(res.map).to.deep.equal({
      "#omg": [":what"]
    });
  });

  it("parameter: #wtf::A", function () {
    const res = parseHashDots("#wtf::A");
    expect(res.tags).to.deep.equal(["#wtf"]);
    expect(res.map).to.deep.equal({
      "#wtf": "::A"
    });
  });
  //todo the string tests look wrong. They should be only a \' and \"..
  it(`Wrong?? String: #singletring.'\\''`, function () {
    const res = parseHashDots(`#singletring.'\\''`);
    expect(res.tags).to.deep.equal(["#singletring"]);
    expect(res.map).to.deep.equal({
      "#singletring": [".'\\''"]
    });
  });
  it(`Wrong?? String: #doubletring."\\""`, function () {
    const res = parseHashDots(`#doubletring."\\""`);
    expect(res.tags).to.deep.equal(["#doubletring"]);
    expect(res.map).to.deep.equal({
      "#doubletring": ['."\\""']
    });
  });
  it(`String: #singletring.'\''`, function () {
    const res = parseHashDots(`#singletring.'\''`);
    expect(res.tags).to.deep.equal(["#singletring"]);
    expect(res.map).to.deep.equal({
      "#singletring": [".'\''"]
    });
  });
  it(`String: #doubletring."\""`, function () {
    const res = parseHashDots(`#doubletring."\""`);
    expect(res.tags).to.deep.equal(["#doubletring"]);
    expect(res.map).to.deep.equal({
      "#doubletring": ['."\""']
    });
  });

});

describe("HashDotMatch", function () {
  it("matchTags(#one:A:B, #one.a.b)", function () {
    const res = new matchTags(parseHashDots("#one:A:B"), parseHashDots("#one.a.b"));
    expect(res.start).to.be.equal(0);
    expect(res.varMap).to.deep.equal({":A": ".a", ":B": ".b"});
  });
  it("matchTags(#one.a.b, #one:A:B)", function () {
    const res = new matchTags(parseHashDots("#one.a.b"), parseHashDots("#one:A:B"));
    expect(res.start).to.be.equal(0);
    expect(res.varMap).to.deep.equal({":A": ".a", ":B": ".b"});
  });
  it("matchTags(#one.a.b.с#two.lala, #one:A:B:C#two:LALA)", function () {
    const res = matchTags(parseHashDots("#one.a.b.c#two.lala"), parseHashDots("#one:A:B:C#two:LALA"));
    expect(res.start).to.be.equal(0);
    expect(res.varMap).to.deep.equal({":A": ".a", ":B": ".b", ":C": ".c", ":LALA": ".lala"});
  });
  it("matchTags(#one.a.b.с#two.lala, #one::ALL)", function () {
    const res = matchTags(parseHashDots("#one.a.b.c#two.lala"), parseHashDots("#one::ALL"));
    expect(res.start).to.be.equal(0);
    expect(res.stop).to.be.equal(1);
    expect(res.varMap).to.deep.equal({"::ALL": [".a", ".b", ".c"]});
  });
  it("matchTags: equal tag names, but unequal tag length", function () {
    let res = matchTags(parseHashDots("#one.a#two.b.error"), parseHashDots("#one:A#two:B:C:D"));
    expect(res).to.be.equal(null);
    res = matchTags(parseHashDots("#one.a.b"), parseHashDots("#one.a.b.c"));
    expect(res).to.be.equal(null);
    res = matchTags(parseHashDots("#one:A.b"), parseHashDots("#one.a:B.c"));
    expect(res).to.be.equal(null);
    res = matchTags(parseHashDots("#one:A:B"), parseHashDots("#one.a:B:C"));
    expect(res).to.be.equal(null);
    res = matchTags(parseHashDots("#one"), parseHashDots("#one.a"));
    expect(res).to.be.equal(null);
    res = matchTags(parseHashDots("#one"), parseHashDots("#one:A"));
    expect(res).to.be.equal(null);
  });
  it("matchTags: equal tag names, but unequal parity", function () {
    const res = matchTags(parseHashDots("#one.a#two.b.error"), parseHashDots("#one:A#two:B:C:D"));
    expect(res).to.be.equal(null);
  });
  it("matchTags with the same variable name on both sides: #one:A#two.b <=> #one.c#two:A", function () {
    const res = matchTags(parseHashDots("#one:A#two.b"), parseHashDots("#one.c#two:A"));
    expect(res.start).to.be.equal(0);
    expect(res.stop).to.be.equal(2);
    expect(res.varMap).to.deep.equal({":A": ".b"});
  });
});

describe("HashDotsRouteMap", function () {
  it("new HashDotsRouteMap()", function () {
    const map = new HashDotsRouteMap({
      "#one:A:B": "#two:A#three:B"
    });
    expect(map.leftRules[0].tags[0]).to.be.equal("#one");
    expect(map.rightRules[0].map["#three"][0]).to.be.equal(":B");
  });

  it("#one:A:B <=> #two:A#three:B", function () {
    const routeMap = new HashDotsRouteMap({
      "#one:A:B": "#two:A#three:B"
    });
    const right = routeMap.right("#one.a.b");
    expect(hashDotsToString(right)).to.be.equal("#two.a#three.b");
    const left = routeMap.left("#two.a#three.b");
    expect(hashDotsToString(left)).to.be.equal("#one.a.b");
  });
  it("#nothing#one:A:B <=> #two:A#three:B", function () {
    const routeMap = new HashDotsRouteMap({
      "#nothing#one:A:B": "#two:A#three:B"
    });
    const right = routeMap.right("#nothing#one.a.b");
    expect(hashDotsToString(right)).to.be.equal("#two.a#three.b");
    const left = routeMap.left("#two.a#three.b");
    expect(hashDotsToString(left)).to.be.equal("#nothing#one.a.b");
  });
  it("#one::A <=> #two::A", function () {
    const routeMap = new HashDotsRouteMap({
      "#one::A": "#two::A"
    });
    const right = routeMap.right("#one.a.b");
    expect(hashDotsToString(right)).to.be.equal("#two.a.b");
    const left = routeMap.left("#two.a.b.c");
    expect(hashDotsToString(left)).to.be.equal("#one.a.b.c");
  });
});
describe("Error tests", function () {
  describe("Syntactic errors (parseHashDots())", function () {
    it("Several universal parameters", () => {
      try {
        const hashDots = parseHashDots("#a::B::C");
      } catch (err) {
        expect(err.message).to.deep.equal("HashDot syntax error. DoubleDots '::' must be the only argument:\nInput:  #a::C::D\nError:       ↑");
      }
    });
    it("Line start with different symbol", () => {
      try {
        parseHashDots(".error");
      } catch (err) {
        expect(err.message).to.deep.equal("HashDot sequence must start with #.\nInput:  .error\nError:  ↑");
      }
    });
    it("Line start without # and ends with different symbol", () => {
      try {
        parseHashDots("error@");
      } catch (err) {
        expect(err.message).to.deep.equal("HashDot sequence must start with #.\nInput:  error@\nError:  ↑");
      }
    });
    it("Empty #", () => {
      try {
        parseHashDots("#empty#");
      } catch (err) {
        expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #empty#\nError:        ↑");
      }
      try {
        parseHashDots("#no##missing.keywords");
      } catch (err) {
        expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #no##missing.keywords\nError:     ↑");
      }
    });
    it("Empty .", () => {
      try {
        parseHashDots("#empty.");
      } catch (err) {
        expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #empty.\nError:        ↑");
      }
      try {
        parseHashDots("#no.missing.#args");
      } catch (err) {
        expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #no.missing.#args\nError:             ↑");
      }
    });
    //todo maybe we should allow whitespace in the format, make it simpler to write the rules?
    it("No whitespace", () => {
      try {
        parseHashDots("#a.b c#d");
      } catch (err) {
        expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #a.b c#d\nError:      ↑");
      }
      try {
        parseHashDots(" #a.b");
      } catch (err) {
        expect(err.message).to.deep.equal("HashDot sequence must start with #.\nInput:   #a.b\nError:  ↑");
      }
      try {
        parseHashDots("#no #whitespace #inBetween");
      } catch (err) {
        expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #no #whitespace #inBetween\nError:     ↑");
      }
      try {
        parseHashDots("#no.w .inBetween");
      } catch (err) {
        expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #no.w .inBetween\nError:       ↑");
      }
    });
    it("HashDot wrong sequence", () => {
      try {
        parseHashDots("#a.b c#d");
      } catch (err) {
        expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #a.b c#d\nError:      ↑");
      }
    });
    // parseHashDots("#no#illegal.characters?%&!¤,;:-_");
  });
});
