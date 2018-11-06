import {HashDots, HashDotMap} from "../../src/router/HashDot.js";

describe("parseHashDot", function () {
  it("basic test: #omg.what.is.'this:!#...#'##wtf/OMG123.123", function () {

    const res = HashDots.parse("#omg.what.is.'this:!#...#'##wtf/OMG123.123");
    expect(res.left).to.deep.equal([
      {
        "tagName": "#omg",
        "tagValue": "omg",
        "args": [".what", ".is", ".'this:!#...#'"],
        "flatArgs": ["what", "is", "this:!#...#"]
      }, {
        "tagName": "##wtf",
        "tagValue": "wtf",
        args: [],
        flatArgs: []
      }, {
        "tagName": "/OMG123",
        "tagValue": "OMG123",
        "args": [".123"],
        "flatArgs": ["123"]
      }
    ]);
    // expect(res.tags).to.deep.equal(["#omg", "##wtf", "/OMG123"]);
    // expect(res.args).to.deep.equal([
    //   [".what", ".is", ".'this:!#...#'"],
    //   [],
    //   [".123"]
    // ]);
  });

  it("parameter: !omg:what", function () {
    const res = HashDots.parse("!omg:what");
    expect(res.left).to.deep.equal([
      {
        "tagName": "!omg",
        "tagValue": "omg",
        "args": [":what-1"],
        "flatArgs": [undefined]
      }]);
    // expect(res.tags).to.deep.equal(["!omg"]);
    // expect(res.args).to.deep.equal([[":what-1"]]);
  });

  it("parameter: #!/wtf::A", function () {
    const res = HashDots.parse("#!/wtf::A");
    expect(res.left).to.deep.equal([
      {
        "tagName": "#!/wtf",
        "tagValue": "wtf",
        "args": "::A-2",
        "flatArgs": []
      }]);
    // expect(res.tags).to.deep.equal(["#!/wtf"]);
    // assert(res.args[0].match(/::A-\d+/));
  });
  it("Whitespace", () => {
    const a = HashDots.parse(" #white.abc#inBetween");
    const b = HashDots.parse("#white.abc#inBetween ");
    expect(a).to.deep.equal(b);
    const c = HashDots.parse("#white.abc #inBetween");
    expect(a).to.deep.equal(c);
    const d = HashDots.parse("#white .abc#inBetween");
    expect(a).to.deep.equal(d);

  });
  it(`String: #singlestring.'\\''`, function () {
    const res = HashDots.parse(`#singlestring.'\\''`);
    expect(res.left).to.deep.equal([{
      "tagName": "#singlestring",
      "tagValue": "singlestring",
      "args": [".'\\''"],
      "flatArgs": ["'"]
    }]);
    // expect(res.tags).to.deep.equal(["#singlestring"]);
    // expect(res.args).to.deep.equal([[".'\\''"]]);
  });
  it(`String: #doublestring."\\""`, function () {
    const res = HashDots.parse(`#doublestring."\\""`);
    expect(res.left).to.deep.equal([{
      "tagName": "#doublestring",
      "tagValue": "doublestring",
      "args": [".\"\\\"\""],
      "flatArgs": ["\""]
    }]);
    // expect(res.tags).to.deep.equal(["#doublestring"]);
    // expect(res.args).to.deep.equal([['."\\""']]);
  });
  it("#one.'a single \\' string?¤#'.end", function () {
    const res = HashDots.parse("#one.'a single \\' string?¤#'.end");
    expect(res.left).to.deep.equal([{
      "tagName": "#one",
      "tagValue": "one",
      "args": [".'a single \\' string?¤#'", ".end"],
      "flatArgs": ["a single ' string?¤#", "end"]
    }]);
    // expect(res.flatArgs[0][0]).to.be.equal("a single ' string?¤#");
  });
  it('#one."a double \\" string?¤#".end', function () {
    const res = HashDots.parse('#one."a double \\" string?¤#".end');
    expect(res.left).to.deep.equal([{
      "tagName": "#one",
      "tagValue": "one",
      "args": [".\"a double \\\" string?¤#\"", ".end"],
      "flatArgs": ["a double \" string?¤#", "end"]
    }]);
    // expect(res.flatArgs[0][0]).to.be.equal('a double " string?¤#');
  });
});

describe("HashDotMatch", function () {
  it("HashDots.subsetMatch(#one:A:B, #one.a.b)", function () {
    const res = HashDots.subsetMatch(HashDots.parse("#one:A:B").left, HashDots.parse("#one.a.b").left);
    expect(res.start).to.be.equal(0);
    expect(res.varMap).to.deep.equal({":A-11": ".a", ":B-11": ".b"});
  });
  it("HashDots.subsetMatch(#one.a.b, #one:A:B)", function () {
    const res = HashDots.subsetMatch(HashDots.parse("#one.a.b").left, HashDots.parse("#one:A:B").left);
    expect(res.start).to.be.equal(0);
    expect(res.varMap).to.deep.equal({":A-14": ".a", ":B-14": ".b"});
  });
  it("HashDots.subsetMatch(#one.a.b.с#two.lala, #one:A:B:C#two:LALA)", function () {
    const res = HashDots.subsetMatch(HashDots.parse("#one.a.b.c#two.lala").left, HashDots.parse("#one:A:B:C#two:LALA").left);
    expect(res.start).to.be.equal(0);
    expect(res.varMap).to.deep.equal({":A-16": ".a", ":B-16": ".b", ":C-16": ".c", ":LALA-16": ".lala"});
  });
  it("HashDots.subsetMatch(#one.a.b.с#two.lala, #one::ALL)", function () {
    const res = HashDots.subsetMatch(HashDots.parse("#one.a.b.c#two.lala").left, HashDots.parse("#one::ALL").left);
    expect(res.start).to.be.equal(0);
    expect(res.stop).to.be.equal(1);
    assert(Object.keys(res.varMap)[0].match(/::ALL-\d+/));
    expect(Object.values(res.varMap)[0]).to.deep.equal([".a", ".b", ".c"]);
  });
  it("HashDots.subsetMatch: equal tag names, but unequal tag length", function () {
    let res = HashDots.subsetMatch(HashDots.parse("#one.a#two.b.error").left, HashDots.parse("#one:A#two:B:C:D").left);
    expect(res).to.be.equal(null);
    res = HashDots.subsetMatch(HashDots.parse("#one.a.b").left, HashDots.parse("#one.a.b.c").left);
    expect(res).to.be.equal(null);
    res = HashDots.subsetMatch(HashDots.parse("#one:A.b").left, HashDots.parse("#one.a:B.c").left);
    expect(res).to.be.equal(null);
    res = HashDots.subsetMatch(HashDots.parse("#one:A:B").left, HashDots.parse("#one.a:B:C").left);
    expect(res).to.be.equal(null);
    res = HashDots.subsetMatch(HashDots.parse("#one").left, HashDots.parse("#one.a").left);
    expect(res).to.be.equal(null);
    res = HashDots.subsetMatch(HashDots.parse("#one").left, HashDots.parse("#one:A").left);
    expect(res).to.be.equal(null);
  });
  it("HashDots.subsetMatch: equal tag names, but unequal parity", function () {
    const res = HashDots.subsetMatch(HashDots.parse("#one.a#two.b.error").left, HashDots.parse("#one:A#two:B:C:D").left);
    expect(res).to.be.equal(null);
  });
  it("HashDots.subsetMatch with the same variable name on both sides: #one:A#two.b <=> #one.c#two:A", function () {
    const res = HashDots.subsetMatch(HashDots.parse("#one:A#two.b").left, HashDots.parse("#one.c#two:A").left);
    expect(res.start).to.be.equal(0);
    expect(res.stop).to.be.equal(2);
    expect(res.varMap).to.deep.equal({':A-33': '.c', ':A-34': '.b'});
  });
  it("HashDots.subsetMatch on the second occurence: #one#two#three#one#four, #one#four", function () {
    const res = HashDots.subsetMatch(HashDots.parse("#one#two#three#one#four").left, HashDots.parse("#one#four").left);
    expect(res.start).to.be.equal(3);
    expect(res.stop).to.be.equal(2);
    expect(res.varMap).to.deep.equal({});
  });
});

describe("HashDotMap", function () {
  it("new HashDotMap()", function () {
    const map = new HashDotMap(["#one:A:B <=> #two:A#three:B"]);
    expect(map.rules[0]).to.deep.equal({
      "left": [{
        "tagName": "#one",
        "tagValue": "one",
        "args": [":A-37", ":B-37"],
        "flatArgs": [undefined, undefined]
      }],
      "right": [{
        "tagName": "#two",
        "tagValue": "two",
        "args": [":A-37"],
        "flatArgs": [undefined]
      }, {
        "tagName": "#three",
        "tagValue": "three",
        "args": [":B-37"],
        "flatArgs": [undefined]
      }]
    });
  });

  it("#one:A:B <=> #two:A#three:B", function () {
    const routeMap = new HashDotMap(["#one:A:B <=> #two:A#three:B"]);
    const right = routeMap.right("#one.a.b");
    expect(right.map(dot => dot.toString()).join("")).to.be.equal("#two.a#three.b");
    const left = routeMap.left("#two.a#three.b");
    expect(left.map(dot => dot.toString()).join("")).to.be.equal("#one.a.b");
  });
  it("#nothing#one:A:B <=> #two:A#three:B", function () {
    const routeMap = new HashDotMap(["#nothing#one:A:B <=> #two:A#three:B"]);
    const right = routeMap.right("#nothing#one.a.b");
    expect(right.map(dot => dot.toString()).join("")).to.be.equal("#two.a#three.b");
    const left = routeMap.left("#two.a#three.b");
    expect(left.map(dot => dot.toString()).join("")).to.be.equal("#nothing#one.a.b");
  });
  it("#one::A <=> #two::A", function () {
    const routeMap = new HashDotMap(["#one::A <=> #two::A"]);
    const right = routeMap.right("#one.a.b");
    expect(right.map(dot => dot.toString()).join("")).to.be.equal("#two.a.b");
    const left = routeMap.left("#two.a.b.c");
    expect(left.map(dot => dot.toString()).join("")).to.be.equal("#one.a.b.c");
  });
  it("#red:A <=> #orange:A && #orange:B <=> #yellow:B", function () {
    const routeMap = new HashDotMap(["#red:A <=> #orange:A", "#orange:B <=> #yellow:B"]);
    const right = routeMap.right("#red.re");
    expect(right.map(dot => dot.toString()).join("")).to.be.equal("#yellow.re");
    const left = routeMap.left("#yellow.ye");
    expect(left.map(dot => dot.toString()).join("")).to.be.equal("#red.ye");
  });
  it("Same variable name across different HashDot statements: #red:A <=> #orange:A && #orange:A <=> #yellow:A", function () {
    const routeMap = new HashDotMap(["#red:A <=> #orange:A", "#orange:A <=> #yellow:A"]);
    const right = routeMap.right("#red.re");
    expect(right.map(dot => dot.toString()).join("")).to.be.equal("#yellow.re");
    const left = routeMap.left("#yellow.ye");
    expect(left.map(dot => dot.toString()).join("")).to.be.equal("#red.ye");
  });
  it("Rule order is preserved and given priority: #a:X <=> #aa:X && #b:X <=> #bb:X && #a:X#b:Y <=> #cc:X:Y", function () {
    const routeMap = new HashDotMap(["#a:A <=> #aa:A", "#b:B <=> #bb:B", "#a:A#b:B <=> #cc:A:B"]);
    const right = routeMap.right("#a.1#b.2");
    expect(right.map(dot => dot.toString()).join("")).to.be.equal("#aa.1#bb.2");
    const left = routeMap.left("#cc.1.2");
    expect(left.map(dot => dot.toString()).join("")).to.be.equal("#a.1#b.2");
  });
  it("Rule order problem for variables: #b:X <=> #c:X && #a:X <=> #b:X", function () {
    const routeMap = new HashDotMap(["#b:A <=> #c:A", "#a:A <=> #b:A"]);
    const right = routeMap.right("#a.1");
    expect(right.map(dot => dot.toString()).join("")).to.be.equal("#c.1");
  });
  it("Need to run a rule twice: #x <=> #y && #a <=> #x && #b <=> #x", function () {
    const routeMap = new HashDotMap(["#x <=> #y", "#a <=> #x", "#b <=> #x"]);
    const right = routeMap.right("#a#b");
    expect(right.map(dot => dot.toString()).join("")).to.be.equal("#y#y");
  });
  it("Need to output the same hashtag with different parameters: #a#x <=> #y.1 && #c#x <=> #y.2 && #b <=> #x && #d <=> #x", function () {
    const routeMap = new HashDotMap(["#a#x <=> #y.1", "#c#x <=> #y.2", "#b <=> #x", "#d <=> #x"]);
    const right = routeMap.right("#a#b#c#d");
    expect(right.map(dot => dot.toString()).join("")).to.be.equal("#y.1#y.2");
  });
});

describe("Syntactic errors (HashDots.parse())", function () {
  it("Several universal parameters", () => {
    try {
      HashDots.parse("#a::B::C");
      assert(false);
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error: DoubleDots '::' must be the only argument.\nInput:  #a::B::C\nError:       ↑");
    }
  });
  it("Line start with different symbol", () => {
    try {
      HashDots.parse(".error");
      assert(false);
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot sequence must start with #,!, or /.\nInput:  .error\nError:  ↑");
    }
  });
  it("Line start without # and ends with different symbol", () => {
    try {
      HashDots.parse("error@");
      assert(false);
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot sequence must start with #,!, or /.\nInput:  error@\nError:  ↑");
    }
  });
  it("Empty #", () => {
    try {
      HashDots.parse("#empty#");
      assert(false);
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #empty#\nError:        ↑");
    }
  });
  it("Empty .", () => {
    try {
      HashDots.parse("#empty.");
      assert(false);
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #empty.\nError:        ↑");
    }
    try {
      HashDots.parse("#no.missing.#args");
      assert(false);
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #no.missing.#args\nError:             ↑");
    }
  });
  it("HashDot wrong sequence", () => {
    try {
      HashDots.parse("#a.b c#d");
      assert(false);
    } catch (err) {
      expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #a.b c#d\nError:       ↑");
    }
  });
  // HashDots.parse("#no#illegal.characters?%&!¤,;:-_").left;
});
