import {
  flatValue,
  hashDotsToString,
  matchTags,
  parseHashDots,
  HashDotsRouteMap
} from "../../src/router/HashDot.js";

describe("parseHashDot", function () {
  it("basic test: #omg.what.is.'this:!#...#'#wtf#OMG123.123", function () {

    const res = parseHashDots("#omg.what.is.'this:!#...#'#wtf#OMG123.123").left;

    expect(res.tags).to.deep.equal(["#omg", "#wtf", "#OMG123"]);
    expect(res.map).to.deep.equal({
      "#omg": [".what", ".is", ".'this:!#...#'"],
      "#wtf": [],
      "#OMG123": [".123"],
    });
  });

  it("parameter: #omg:what", function () {
    const res = parseHashDots("#omg:what").left;
    expect(res.tags).to.deep.equal(["#omg"]);
    expect(res.map).to.deep.equal({
      "#omg": [":what"]
    });
  });

  it("parameter: #wtf::A", function () {
    const res = parseHashDots("#wtf::A").left;
    expect(res.tags).to.deep.equal(["#wtf"]);
    assert(res.map["#wtf"].match(/::A-\d+/));
  });
  it(`String: #singlestring.'\\''`, function () {
    const res = parseHashDots(`#singlestring.'\\''`).left;
    expect(res.tags).to.deep.equal(["#singlestring"]);
    expect(res.map).to.deep.equal({
      "#singlestring": [".'\\''"]
    });
  });
  it(`String: #doublestring."\\""`, function () {
    const res = parseHashDots(`#doublestring."\\""`).left;
    expect(res.tags).to.deep.equal(["#doublestring"]);
    expect(res.map).to.deep.equal({
      "#doublestring": ['."\\""']
    });
  });
  it("#one.'a single \\' string?¤#'.end", function () {
    const res = parseHashDots("#one.'a single \\' string?¤#'.end").left;
    expect(flatValue(res.map["#one"][0])).to.be.equal("a single ' string?¤#");
  });
  it('#one."a double \\" string?¤#".end', function () {
    const res = parseHashDots('#one."a double \\" string?¤#".end').left;
    expect(flatValue(res.map["#one"][0])).to.be.equal('a double " string?¤#');
  });
});

describe("HashDotMatch", function () {
  it("matchTags(#one:A:B, #one.a.b)", function () {
    const res = matchTags(parseHashDots("#one:A:B").left, parseHashDots("#one.a.b").left, {});
    expect(res.start).to.be.equal(0);
    expect(res.varMap).to.deep.equal({":A": ".a", ":B": ".b"});
  });
  it("matchTags(#one.a.b, #one:A:B)", function () {
    const res = matchTags(parseHashDots("#one.a.b").left, parseHashDots("#one:A:B").left, {});
    expect(res.start).to.be.equal(0);
    expect(res.varMap).to.deep.equal({":A": ".a", ":B": ".b"});
  });
  it("matchTags(#one.a.b.с#two.lala, #one:A:B:C#two:LALA)", function () {
    const res = matchTags(parseHashDots("#one.a.b.c#two.lala").left, parseHashDots("#one:A:B:C#two:LALA").left, {});
    expect(res.start).to.be.equal(0);
    expect(res.varMap).to.deep.equal({":A": ".a", ":B": ".b", ":C": ".c", ":LALA": ".lala"});
  });
  it("matchTags(#one.a.b.с#two.lala, #one::ALL)", function () {
    const res = matchTags(parseHashDots("#one.a.b.c#two.lala").left, parseHashDots("#one::ALL").left, {});
    expect(res.start).to.be.equal(0);
    expect(res.stop).to.be.equal(1);
    assert(Object.keys(res.varMap)[0].match(/::ALL-\d+/));
    expect(Object.values(res.varMap)[0]).to.deep.equal([".a", ".b", ".c"]);
  });
  it("matchTags: equal tag names, but unequal tag length", function () {
    let res = matchTags(parseHashDots("#one.a#two.b.error").left, parseHashDots("#one:A#two:B:C:D").left, {});
    expect(res).to.be.equal(null);
    res = matchTags(parseHashDots("#one.a.b").left, parseHashDots("#one.a.b.c").left, {});
    expect(res).to.be.equal(null);
    res = matchTags(parseHashDots("#one:A.b").left, parseHashDots("#one.a:B.c").left, {});
    expect(res).to.be.equal(null);
    res = matchTags(parseHashDots("#one:A:B").left, parseHashDots("#one.a:B:C").left, {});
    expect(res).to.be.equal(null);
    res = matchTags(parseHashDots("#one").left, parseHashDots("#one.a").left, {});
    expect(res).to.be.equal(null);
    res = matchTags(parseHashDots("#one").left, parseHashDots("#one:A").left, {});
    expect(res).to.be.equal(null);
  });
  it("matchTags: equal tag names, but unequal parity", function () {
    const res = matchTags(parseHashDots("#one.a#two.b.error").left, parseHashDots("#one:A#two:B:C:D").left, {});
    expect(res).to.be.equal(null);
  });
  it("matchTags with the same variable name on both sides: #one:A#two.b <=> #one.c#two:A", function () {
    const res = matchTags(parseHashDots("#one:A#two.b").left, parseHashDots("#one.c#two:A").left, {});
    expect(res.start).to.be.equal(0);
    expect(res.stop).to.be.equal(2);
    expect(res.varMap).to.deep.equal({":A": ".b"});
  });
});

describe("HashDotsRouteMap", function () {
  it("new HashDotsRouteMap()", function () {
    const map = new HashDotsRouteMap(["#one:A:B <=> #two:A#three:B"]);
    expect(map.leftRules[0].tags[0]).to.be.equal("#one");
    expect(map.rightRules[0].map["#three"][0]).to.be.equal(":B");
  });

  it("#one:A:B <=> #two:A#three:B", function () {
    const routeMap = new HashDotsRouteMap(["#one:A:B <=> #two:A#three:B"]);
    const right = routeMap.right("#one.a.b");
    expect(hashDotsToString(right)).to.be.equal("#two.a#three.b");
    const left = routeMap.left("#two.a#three.b");
    expect(hashDotsToString(left)).to.be.equal("#one.a.b");
  });
  it("#nothing#one:A:B <=> #two:A#three:B", function () {
    const routeMap = new HashDotsRouteMap(["#nothing#one:A:B <=> #two:A#three:B"]);
    const right = routeMap.right("#nothing#one.a.b");
    expect(hashDotsToString(right)).to.be.equal("#two.a#three.b");
    const left = routeMap.left("#two.a#three.b");
    expect(hashDotsToString(left)).to.be.equal("#nothing#one.a.b");
  });
  it("#one::A <=> #two::A", function () {
    const routeMap = new HashDotsRouteMap(["#one::A <=> #two::A"]);
    const right = routeMap.right("#one.a.b");
    expect(hashDotsToString(right)).to.be.equal("#two.a.b");
    const left = routeMap.left("#two.a.b.c");
    expect(hashDotsToString(left)).to.be.equal("#one.a.b.c");
  });
  it("#red:A <=> #orange:A && #orange:B <=> #yellow:B", function () {
    const routeMap = new HashDotsRouteMap(["#red:A <=> #orange:A", "#orange:B <=> #yellow:B"]);
    const right = routeMap.right("#red.re");
    expect(hashDotsToString(right)).to.be.equal("#yellow.re");
    const left = routeMap.left("#yellow.ye");
    expect(hashDotsToString(left)).to.be.equal("#red.ye");
  });
  // it("#red:A <=> #orange:A && #orange:A <=> #yellow:A", function () {
  //   const routeMap = new HashDotsRouteMap({
  //     "#red:A": "#orange:A",
  //     "#orange:A": "#yellow:A"
  //   });
  //   const right = routeMap.right("#red.re");
  //   expect(hashDotsToString(right)).to.be.equal("#yellow.re");
  //   const left = routeMap.left("#yellow.ye");
  //   expect(hashDotsToString(left)).to.be.equal("#red.ye");
  // });
});

describe("Syntactic errors (parseHashDots())", function () {
  it("Several universal parameters", () => {
    try {
      parseHashDots("#a::B::C").left;
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error. DoubleDots '::' must be the only argument:\nInput:  #a::B::C\nError:       ↑");
    }
  });
  it("Line start with different symbol", () => {
    try {
      parseHashDots(".error").left;
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot sequence must start with #.\nInput:  .error\nError:  ↑");
    }
  });
  it("Line start without # and ends with different symbol", () => {
    try {
      parseHashDots("error@").left;
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot sequence must start with #.\nInput:  error@\nError:  ↑");
    }
  });
  it("Empty #", () => {
    try {
      parseHashDots("#empty#").left;
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #empty#\nError:        ↑");
    }
    try {
      parseHashDots("#no##missing.keywords").left;
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #no##missing.keywords\nError:     ↑");
    }
  });
  it("Empty .", () => {
    try {
      parseHashDots("#empty.").left;
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #empty.\nError:        ↑");
    }
    try {
      parseHashDots("#no.missing.#args").left;
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #no.missing.#args\nError:             ↑");
    }
  });
  //todo maybe we should allow whitespace in the format, make it simpler to write the rules?
  it("No whitespace", () => {
    try {
      parseHashDots("#a.b c#d").left;
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #a.b c#d\nError:      ↑");
    }
    try {
      parseHashDots(" #a.b").left;
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot sequence must start with #.\nInput:   #a.b\nError:  ↑");
    }
    try {
      parseHashDots("#no #whitespace #inBetween").left;
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #no #whitespace #inBetween\nError:     ↑");
    }
    try {
      parseHashDots("#no.w .inBetween").left;
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #no.w .inBetween\nError:       ↑");
    }
  });
  it("HashDot wrong sequence", () => {
    try {
      parseHashDots("#a.b c#d").left;
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #a.b c#d\nError:      ↑");
    }
  });
  // parseHashDots("#no#illegal.characters?%&!¤,;:-_").left;
});
