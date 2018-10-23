import {parseHashDots} from "../../src/router/HashDot.js";

describe("parseHashDot", function () {
  it("basic test: #omg.what.is.'this?!#...#'#wtf#OMG123.123", function () {

    const test = "#omg.what.is.'this?!#...#'#wtf#OMG123.123";
    let res = parseHashDots(test);
    expect(res).to.deep.equal([
      {
        keyword: "omg",
        signature: "omg/3",
        arguments: ["what", "is", "'this?!#...#'"],
        argumentString: ".what.is.'this?!#...#'"
      }, {
        keyword: "wtf",
        signature: "wtf/0",
        arguments: [],
        argumentString: ""
      }, {
        keyword: "OMG123",
        signature: "OMG123/1",
        arguments: ["123"],
        argumentString: ".123"
      }]);
  });
});
