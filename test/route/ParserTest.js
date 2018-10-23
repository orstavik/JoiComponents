import {parseHashDots} from "../../src/router/HashDot.js";

describe("parseHashDot", function () {
  it("basic test: #omg.what.is.'this?!#...#'#wtf#OMG123.123", function () {

    const test = "#omg.what.is.'this?!#...#'#wtf#OMG123.123";
    let res = parseHashDots(test);
    expect(res.map).to.deep.equal({
      omg: ["what", "is", "'this?!#...#'"],
      wtf: [],
      OMG123: ["123"],
    });
    expect(res.tree).to.deep.equal([
      {
        keyword: "omg",
        signature: "omg/3",
        arguments: ["what", "is", "'this?!#...#'"],
        argumentTypes: [".", ".", "."],
        argumentString: ".what.is.'this?!#...#'"
      }, {
        keyword: "wtf",
        signature: "wtf/0",
        arguments: [],
        argumentTypes: [],
        argumentString: ""
      }, {
        keyword: "OMG123",
        signature: "OMG123/1",
        arguments: ["123"],
        argumentTypes: ["."],
        argumentString: ".123"
      }
    ]);
  });

  it("parameter: #omg:what", function () {
    const test = "#omg:what";
    let res = parseHashDots(test);
    expect(res.map).to.deep.equal({
      omg: ["what"]
    });
    expect(res.tree).to.deep.equal([
      {
        keyword: "omg",
        signature: "omg/1",
        arguments: ["what"],
        argumentTypes: [":"],
        argumentString: ":what"
      }
    ]);
  });

  it("parameter: #wtf?A", function () {
    const test = "#wtf?A";
    let res = parseHashDots(test);
    expect(res.map).to.deep.equal({
      wtf: ["A"]
    });
    expect(res.tree).to.deep.equal([
      {
        keyword: "wtf",
        signature: "wtf/1",
        arguments: ["A"],
        argumentTypes: ["?"],
        argumentString: "?A"
      }
    ]);
  });
});

/*
describe("HashDotMap", function () {
  it("map test", function () {
    const routeMap = new HashDotsRouteMap({
      "#one.A.B": "#two.A#three.B"
    });
    // const right = routeMap.right("#one.a.b");
    // expect(right).to.deep.equal("#two.a#three.b");
    // const left = routeMap.left("#two.a#three.b");
    // expect(left).to.deep.equal("#one.a.b");
  });
});
*/
