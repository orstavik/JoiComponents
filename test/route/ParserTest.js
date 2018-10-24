import {mapHashDots, parseHashDots, HashDotsRouteMap} from "../../src/router/HashDot.js";

describe("parseHashDot", function () {
  it("basic test: #omg.what.is.'this?!#...#'#wtf#OMG123.123", function () {

    const test = "#omg.what.is.'this?!#...#'#wtf#OMG123.123";
    const hashDots = parseHashDots(test);
    const res = mapHashDots(hashDots);

    expect(res.map).to.deep.equal({
      omg: ["what", "is", "'this?!#...#'"],
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
        arguments: ["what", "is", "'this?!#...#'"],
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

  it("parameter: #wtf?A", function () {
    const test = "#wtf?A";
    const hashDots = parseHashDots(test);
    const res = mapHashDots(hashDots);
    expect(res).to.deep.equal({
      params: {
        "?A": {type: "?", name: "A", keyword: "wtf", position: 0}
      },
      map: {
        wtf: ["A"]
      },
      typesMap: {
        wtf: ["?"]
      },
      tree: [
        {
          keyword: "wtf",
          arguments: ["A"],
          argumentTypes: ["?"],
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
  it("#one?A <=> #two?A", function () {
    const routeMap = new HashDotsRouteMap({
      "#one?A": "#two?A"
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
        const test = "#a?b?c";
        const hashDots = parseHashDots(test);
        const res = mapHashDots(hashDots);
      } catch (err) {
        expect(err);
        expect(err.message).to.deep.equal("A HashDot can only contain a single universal parameter \'?\'.\nNot a sequence of either arguments \'.something\' and/or parameters \':A\', not both.");
      }
    });
  });

  describe("Syntactic errors (parseHashDots())", function () {
    it("Line start with different symbol", () => {
      try {
        const test = ".error";
        const hashDots = parseHashDots(test);
      } catch (err) {
        expect(err);
        expect(err.message).to.deep.equal("A HashDot must start with #Keyword (#[\\w]+): -->.error<--\nFull HashDots string: -->.error<--");
      }
    });
    it("Line start without # and ends with different symbol", () => {
      try {
        const test = "error@";
        const hashDots = parseHashDots(test);
      } catch (err) {
        expect(err);
        expect(err.message).to.deep.equal("HashDots cannot end with: -->error<--.\nFull HashDots string: -->error@<--");
      }
    });
    it("Hash symbol as an argument of HashDot", () => {
      try {
        const test = "#assa.#";
        const hashDots = parseHashDots(test);
      } catch (err) {
        expect(err);
        expect(err.message).to.deep.equal("A HashDot argument value must be an AlpaNumeric or a \"quoted\" 'string'.");
      }
    });
    it("HashDot wrong sequence", () => {
      try {
        const test = "#a.b c#d";
        const hashDots = parseHashDots(test);
      } catch (err) {
        expect(err);
        expect(err.message).to.deep.equal("A HashDot sequence begins with either \'#\', \'.\' or \':\', not: -->c<--");
      }
    });
  });
});
