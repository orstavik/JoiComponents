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
    expect(res.params).to.deep.equal({"?A" : {type: "?", name: "A", keyword: "wtf", position: 0}});
    expect(res.map).to.deep.equal({
      wtf: ["A"]
    });
    expect(res.typesMap).to.deep.equal({
      wtf: ["?"]
    });
    expect(res.tree).to.deep.equal([
      {
        keyword: "wtf",
        arguments: ["A"],
        argumentTypes: ["?"],
      }
    ]);
  });
});

describe("HashDotMap", function () {
  it("leftToRight: #one:A:B <=> #two:A#three:B", function () {
    const routeMap = new HashDotsRouteMap({
      "#one:A:B": "#two:A#three:B"
    });
    const right = routeMap.right("#one.a.b");
    expect(right).to.deep.equal(mapHashDots(parseHashDots("#two.a#three.b")));
    const left = routeMap.left("#two.a#three.b");
    expect(left).to.deep.equal(mapHashDots(parseHashDots("#one.a.b")));
  });
  it("leftToRight: #nothing#one:A:B <=> #two:A#three:B", function () {
    const routeMap = new HashDotsRouteMap({
      "#nothing#one:A:B": "#two:A#three:B"
    });
    const right = routeMap.right("#nothing#one.a.b");
    expect(right).to.deep.equal(mapHashDots(parseHashDots("#two.a#three.b")));
    const left = routeMap.left("#two.a#three.b");
    expect(left).to.deep.equal(mapHashDots(parseHashDots("#nothing#one.a.b")));
  });
});
