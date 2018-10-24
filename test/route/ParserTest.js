import {parseHashDots, HashDotsRouteMap} from "../../src/router/HashDot.js";

describe("parseHashDot", function () {
  it("basic test: #omg.what.is.'this?!#...#'#wtf#OMG123.123", function () {

    const test = "#omg.what.is.'this?!#...#'#wtf#OMG123.123";
    let res = parseHashDots(test);
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
    let res = parseHashDots(test);
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
    let res = parseHashDots(test);
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
    expect(right.map).to.deep.equal({
      two: ["a"],
      three: ["b"]
    });
    expect(right.typesMap).to.deep.equal({
      two: ["."],
      three: ["."],
    });
    expect(right.params).to.deep.equal({});
    expect(right.tree).to.deep.equal([
      {
        keyword: "two",
        arguments: ["a"],
        argumentTypes: ["."],
      }, {
        keyword: "three",
        arguments: ["b"],
        argumentTypes: ["."],
      }
    ]);
  });
  it("leftToRight: #one:A:B <=> #two:A#three:B", function () {
    const routeMap = new HashDotsRouteMap({
      "#one:A:B": "#two:A#three:B"
    });
    const left = routeMap.left("#two.a#three.b");
    expect(left.map).to.deep.equal({
      one: ["a", "b"]
    });
    expect(left.typesMap).to.deep.equal({
      one: [".", "."],
    });
    expect(left.params).to.deep.equal({});
    expect(left.tree).to.deep.equal([
      {
        keyword: "one",
        arguments: ["a", "b"],
        argumentTypes: [".", "."],
      }
    ]);
  });
});
