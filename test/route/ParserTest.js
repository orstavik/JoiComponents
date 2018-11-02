import {HashDots, HashDotMap} from "../../src/router/HashDot.js";

describe("parseHashDot", function () {
  it("basic test: #omg.what.is.'this:!#...#'#wtf#OMG123.123", function () {

    const res = HashDots.parse("#omg.what.is.'this:!#...#'#wtf#OMG123.123").left;

    expect(res.tags).to.deep.equal(["#omg", "#wtf", "#OMG123"]);
    expect(res.args).to.deep.equal([
      [".what", ".is", ".'this:!#...#'"],
      [],
      [".123"]
    ]);
  });

  it("parameter: #omg:what", function () {
    const res = HashDots.parse("#omg:what").left;
    expect(res.tags).to.deep.equal(["#omg"]);
    expect(res.args).to.deep.equal([[":what-1"]]);
  });

  it("parameter: #wtf::A", function () {
    const res = HashDots.parse("#wtf::A").left;
    expect(res.tags).to.deep.equal(["#wtf"]);
    assert(res.args[0].match(/::A-\d+/));
  });
  it(`String: #singlestring.'\\''`, function () {
    const res = HashDots.parse(`#singlestring.'\\''`).left;
    expect(res.tags).to.deep.equal(["#singlestring"]);
    expect(res.args).to.deep.equal([[".'\\''"]]);
  });
  it(`String: #doublestring."\\""`, function () {
    const res = HashDots.parse(`#doublestring."\\""`).left;
    expect(res.tags).to.deep.equal(["#doublestring"]);
    expect(res.args).to.deep.equal([['."\\""']]);
  });
  it("#one.'a single \\' string?¤#'.end", function () {
    const res = HashDots.parse("#one.'a single \\' string?¤#'.end").left;
    expect(HashDots.flatValue(res.args[0][0])).to.be.equal("a single ' string?¤#");
  });
  it('#one."a double \\" string?¤#".end', function () {
    const res = HashDots.parse('#one."a double \\" string?¤#".end').left;
    expect(HashDots.flatValue(res.args[0][0])).to.be.equal('a double " string?¤#');
  });
});

describe("HashDotMatch", function () {
  it("HashDots.match(#one:A:B, #one.a.b)", function () {
    const res = HashDots.match(HashDots.parse("#one:A:B").left, HashDots.parse("#one.a.b").left, {});
    expect(res.start).to.be.equal(0);
    expect(res.varMap).to.deep.equal({":A-7": ".a", ":B-7": ".b"});
  });
  it("HashDots.match(#one.a.b, #one:A:B)", function () {
    const res = HashDots.match(HashDots.parse("#one.a.b").left, HashDots.parse("#one:A:B").left, {});
    expect(res.start).to.be.equal(0);
    expect(res.varMap).to.deep.equal({":A-10": ".a", ":B-10": ".b"});
  });
  it("HashDots.match(#one.a.b.с#two.lala, #one:A:B:C#two:LALA)", function () {
    const res = HashDots.match(HashDots.parse("#one.a.b.c#two.lala").left, HashDots.parse("#one:A:B:C#two:LALA").left, {});
    expect(res.start).to.be.equal(0);
    expect(res.varMap).to.deep.equal({":A-12": ".a", ":B-12": ".b", ":C-12": ".c", ":LALA-12": ".lala"});
  });
  it("HashDots.match(#one.a.b.с#two.lala, #one::ALL)", function () {
    const res = HashDots.match(HashDots.parse("#one.a.b.c#two.lala").left, HashDots.parse("#one::ALL").left, {});
    expect(res.start).to.be.equal(0);
    expect(res.stop).to.be.equal(1);
    assert(Object.keys(res.varMap)[0].match(/::ALL-\d+/));
    expect(Object.values(res.varMap)[0]).to.deep.equal([".a", ".b", ".c"]);
  });
  it("HashDots.match: equal tag names, but unequal tag length", function () {
    let res = HashDots.match(HashDots.parse("#one.a#two.b.error").left, HashDots.parse("#one:A#two:B:C:D").left, {});
    expect(res).to.be.equal(null);
    res = HashDots.match(HashDots.parse("#one.a.b").left, HashDots.parse("#one.a.b.c").left, {});
    expect(res).to.be.equal(null);
    res = HashDots.match(HashDots.parse("#one:A.b").left, HashDots.parse("#one.a:B.c").left, {});
    expect(res).to.be.equal(null);
    res = HashDots.match(HashDots.parse("#one:A:B").left, HashDots.parse("#one.a:B:C").left, {});
    expect(res).to.be.equal(null);
    res = HashDots.match(HashDots.parse("#one").left, HashDots.parse("#one.a").left, {});
    expect(res).to.be.equal(null);
    res = HashDots.match(HashDots.parse("#one").left, HashDots.parse("#one:A").left, {});
    expect(res).to.be.equal(null);
  });
  it("HashDots.match: equal tag names, but unequal parity", function () {
    const res = HashDots.match(HashDots.parse("#one.a#two.b.error").left, HashDots.parse("#one:A#two:B:C:D").left, {});
    expect(res).to.be.equal(null);
  });
  it("HashDots.match with the same variable name on both sides: #one:A#two.b <=> #one.c#two:A", function () {
    const res = HashDots.match(HashDots.parse("#one:A#two.b").left, HashDots.parse("#one.c#two:A").left, {});
    expect(res.start).to.be.equal(0);
    expect(res.stop).to.be.equal(2);
    expect(res.varMap).to.deep.equal({':A-29': '.c', ':A-30': '.b'});
  });
});

describe("HashDotMap", function () {
  it("new HashDotMap()", function () {
    const map = new HashDotMap(["#one:A:B <=> #two:A#three:B"]);
    expect(map.rules[0].left.tags[0]).to.be.equal("#one");
    expect(map.reverseRules[0].left.args[1][0]).to.be.equal(":B-31");
  });

  it("#one:A:B <=> #two:A#three:B", function () {
    const routeMap = new HashDotMap(["#one:A:B <=> #two:A#three:B"]);
    const right = routeMap.right("#one.a.b");
    expect(HashDots.toString(right)).to.be.equal("#two.a#three.b");
    const left = routeMap.left("#two.a#three.b");
    expect(HashDots.toString(left)).to.be.equal("#one.a.b");
  });
  it("#nothing#one:A:B <=> #two:A#three:B", function () {
    const routeMap = new HashDotMap(["#nothing#one:A:B <=> #two:A#three:B"]);
    const right = routeMap.right("#nothing#one.a.b");
    expect(HashDots.toString(right)).to.be.equal("#two.a#three.b");
    const left = routeMap.left("#two.a#three.b");
    expect(HashDots.toString(left)).to.be.equal("#nothing#one.a.b");
  });
  it("#one::A <=> #two::A", function () {
    const routeMap = new HashDotMap(["#one::A <=> #two::A"]);
    const right = routeMap.right("#one.a.b");
    expect(HashDots.toString(right)).to.be.equal("#two.a.b");
    const left = routeMap.left("#two.a.b.c");
    expect(HashDots.toString(left)).to.be.equal("#one.a.b.c");
  });
  it("#red:A <=> #orange:A && #orange:B <=> #yellow:B", function () {
    const routeMap = new HashDotMap(["#red:A <=> #orange:A", "#orange:B <=> #yellow:B"]);
    const right = routeMap.right("#red.re");
    expect(HashDots.toString(right)).to.be.equal("#yellow.re");
    const left = routeMap.left("#yellow.ye");
    expect(HashDots.toString(left)).to.be.equal("#red.ye");
  });
  it("Same variable name across different HashDot statements: #red:A <=> #orange:A && #orange:A <=> #yellow:A", function () {
    const routeMap = new HashDotMap(["#red:A <=> #orange:A", "#orange:A <=> #yellow:A"]);
    const right = routeMap.right("#red.re");
    expect(HashDots.toString(right)).to.be.equal("#yellow.re");
    const left = routeMap.left("#yellow.ye");
    expect(HashDots.toString(left)).to.be.equal("#red.ye");
  });
  it("Rule order is preserved and given priority: #a:X <=> #aa:X && #b:X <=> #bb:X && #a:X#b:Y <=> #cc:X:Y", function () {
    const routeMap = new HashDotMap(["#a:A <=> #aa:A", "#b:B <=> #bb:B", "#a:A#b:B <=> #cc:A:B"]);
    const right = routeMap.right("#a.1#b.2");
    expect(HashDots.toString(right)).to.be.equal("#aa.1#bb.2");
    const left = routeMap.left("#cc.1.2");
    expect(HashDots.toString(left)).to.be.equal("#a.1#b.2");
  });
  it("Rule order problem for variables: #b:X <=> #c:X && #a:X <=> #b:X", function () {
    const routeMap = new HashDotMap(["#b:A <=> #c:A", "#a:A <=> #b:A"]);
    const right = routeMap.right("#a.1");
    expect(HashDots.toString(right)).to.be.equal("#c.1");
  });
  it("Need to run a rule twice: #x <=> #y && #a <=> #x && #b <=> #x", function () {
    const routeMap = new HashDotMap(["#x <=> #y", "#a <=> #x", "#b <=> #x"]);
    const right = routeMap.right("#a#b");
    expect(HashDots.toString(right)).to.be.equal("#y#y");
  });
  it("Need to output the same hashtag with different parameters: #a#x <=> #y.1 && #c#x <=> #y.2 && #b <=> #x && #d <=> #x", function () {
    const routeMap = new HashDotMap(["#a#x <=> #y.1", "#c#x <=> #y.2", "#b <=> #x", "#d <=> #x"]);
    const right = routeMap.right("#a#b#c#d");
    expect(HashDots.toString(right)).to.be.equal("#y.1#y.2");
    //todo the bug is #y2.#y.2 because the HashDots.parse produce a map that only accepts a single entry per hashtag name
    //todo the fix is to make the map use the name + tag position of the hashtag for its arguments.
    //todo or.. only the position? As a map
  });
});

describe("Syntactic errors (HashDots.parse())", function () {
  it("Several universal parameters", () => {
    try {
      HashDots.parse("#a::B::C");
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error. DoubleDots '::' must be the only argument:\nInput:  #a::B::C\nError:       ↑");
    }
  });
  it("Line start with different symbol", () => {
    try {
      HashDots.parse(".error");
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot sequence must start with #.\nInput:  .error\nError:  ↑");
    }
  });
  it("Line start without # and ends with different symbol", () => {
    try {
      HashDots.parse("error@");
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot sequence must start with #.\nInput:  error@\nError:  ↑");
    }
  });
  it("Empty #", () => {
    try {
      HashDots.parse("#empty#");
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #empty#\nError:        ↑");
    }
    try {
      HashDots.parse("#no##missing.keywords");
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #no##missing.keywords\nError:     ↑");
    }
  });
  it("Empty .", () => {
    try {
      HashDots.parse("#empty.");
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #empty.\nError:        ↑");
    }
    try {
      HashDots.parse("#no.missing.#args");
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #no.missing.#args\nError:             ↑");
    }
  });
  //todo maybe we should allow whitespace in the format, make it simpler to write the rules?
  it("No whitespace", () => {
    try {
      HashDots.parse("#a.b c#d");
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #a.b c#d\nError:      ↑");
    }
    try {
      HashDots.parse(" #a.b");
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot sequence must start with #.\nInput:   #a.b\nError:  ↑");
    }
    try {
      HashDots.parse("#no #whitespace #inBetween");
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #no #whitespace #inBetween\nError:     ↑");
    }
    try {
      HashDots.parse("#no.w .inBetween");
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #no.w .inBetween\nError:       ↑");
    }
  });
  it("HashDot wrong sequence", () => {
    try {
      HashDots.parse("#a.b c#d");
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #a.b c#d\nError:      ↑");
    }
  });
  // HashDots.parse("#no#illegal.characters?%&!¤,;:-_").left;
});
