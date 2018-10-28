import {mapHashDots, parseHashDots, HashDotsRouteMap} from "../../src/router/HashDot.js";

describe("parseHashDot", function () {
  it("basic test: #omg.what.is.'this:!#...#'#wtf#OMG123.123", function () {

    const test = "#omg.what.is.'this:!#...#'#wtf#OMG123.123";
    const hashDots = parseHashDots(test);
    const res = mapHashDots(hashDots);

    expect(res.map).to.deep.equal({
      omg: ["what", "is", "'this:!#...#'"],
      wtf: [],
      OMG123: ["123"],
    });
    expect(res.typesMap).to.deep.equal({
      omg: [".", ".", "."],
      wtf: [],
      OMG123: ["."],
    });
    expect(res.params).to.deep.equal({});
    expect(res.tree).to.deep.equal([
      {
        keyword: "omg",
        arguments: ["what", "is", "'this:!#...#'"],
        argumentTypes: [".", ".", "."],
      }, {
        keyword: "wtf",
        arguments: [],
        argumentTypes: [],
      }, {
        keyword: "OMG123",
        arguments: ["123"],
        argumentTypes: ["."],
      }
    ]);
  });

  it("parameter: #omg:what", function () {
    const test = "#omg:what";
    const hashDots = parseHashDots(test);
    const res = mapHashDots(hashDots);
    expect(res.params).to.deep.equal({":what": {type: ":", name: "what", keyword: "omg", position: 0}});
    expect(res.map).to.deep.equal({
      omg: ["what"]
    });
    expect(res.typesMap).to.deep.equal({
      omg: [":"]
    });
    expect(res.tree).to.deep.equal([
      {
        keyword: "omg",
        arguments: ["what"],
        argumentTypes: [":"],
      }
    ]);
  });

  it("parameter: #wtf::A", function () {
    const test = "#wtf::A";
    const hashDots = parseHashDots(test);
    const res = mapHashDots(hashDots);
    expect(res).to.deep.equal({
      params: {
        "::A": {type: "::", name: "A", keyword: "wtf", position: 0}
      },
      map: {
        wtf: ["A"]
      },
      typesMap: {
        wtf: ["::"]
      },
      tree: [
        {
          keyword: "wtf",
          arguments: ["A"],
          argumentTypes: ["::"],
        }
      ]
    });
  });
});

describe("HashDotMap", function () {
  it("#one:A:B <=> #two:A#three:B", function () {
    const routeMap = new HashDotsRouteMap({
      "#one:A:B": "#two:A#three:B"
    });
    const right = routeMap.right("#one.a.b");
    expect(right).to.deep.equal(mapHashDots(parseHashDots("#two.a#three.b")));
    const left = routeMap.left("#two.a#three.b");
    expect(left).to.deep.equal(mapHashDots(parseHashDots("#one.a.b")));
  });
  it("#nothing#one:A:B <=> #two:A#three:B", function () {
    const routeMap = new HashDotsRouteMap({
      "#nothing#one:A:B": "#two:A#three:B"
    });
    const right = routeMap.right("#nothing#one.a.b");
    expect(right).to.deep.equal(mapHashDots(parseHashDots("#two.a#three.b")));
    const left = routeMap.left("#two.a#three.b");
    expect(left).to.deep.equal(mapHashDots(parseHashDots("#nothing#one.a.b")));
  });
  it("#one::A <=> #two::A", function () {
    const routeMap = new HashDotsRouteMap({
      "#one::A": "#two::A"
    });
    const right = routeMap.right("#one.a.b");
    expect(right).to.deep.equal(mapHashDots(parseHashDots("#two.a.b")));
    const left = routeMap.left("#two.a.b.c");
    expect(left).to.deep.equal(mapHashDots(parseHashDots("#one.a.b.c")));
  });
});
describe("Error tests", function () {
  describe("Semantic errors", function () {
    it("Several universal parameters (mapHashDots())", () => {
      try {
        const test = "#a::b::c";
        const hashDots = parseHashDots(test);
        mapHashDots(hashDots);
      } catch (err) {
        expect(err);
        expect(err.message).to.deep.equal("If a HashDot has a DoubleDoubleDot \'::\' variable, it can have no other arguments.");
      }
    });
  });

  describe("Syntactic errors (parseHashDots())", function () {
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
    it("Hash symbol as an argument of HashDot", () => {
      try {
        parseHashDots("#assa.#");
      } catch (err) {
        expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #assa.#\nError:       ↑");
      }
    });
    it("HashDot wrong sequence", () => {
      try {
        parseHashDots("#a.b c#d");
      } catch (err) {
        expect(err.message).to.deep.equal("HashDot syntax error:\nInput:  #a.b c#d\nError:      ↑");
      }
    });
  });
});
