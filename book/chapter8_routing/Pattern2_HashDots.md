# Pattern: HashDots

## Parsing HashDots

**HashDots** is a new, hybrid format combining the conventions of hashtags and filenames.
The purpose of HashDots is to make links that:
 * are familiar and user-readable
 * have a form that represent their content
 * scale functionally to enable developers build more powerful client-side applications
   with less complexity.


   
### PseudoCode
```
HashDots := (#<HashDot>)+
HashDot := <Keyword><Dots>
Keyword := [\w\d]+
Dots := ([.]<Dot>)*
Dot := Keyword|String
String := {string wrapped in a pair of " or '.}
```

### JS function
```javascript
function parseHashDots(hashString) {

  function tokenType(c) {
    if (c === "'" || c === '"') return "'";
    if (/[\d\w]/.test(c)) return "w";
    if (c === "#") return "#";
    if (c === ".") return ".";
    return "u";
  }

  const toks = /("|')((?:\\\1|(?:(?!\1).))*)\1|\.|#|[\d\w]+/g;
  const res = [];
  let one = undefined;
  let hashtag;

  for (let t = toks.exec(hashString); t !== null; t = toks.exec(hashString)) {
    let w = t[0];
    let c = w[0];
    let two = tokenType(c);
    if (!one) {
      one = two;
      continue;
    }
    if (one === "#") {
      if (two === "w") {
        hashtag = {keyword: w, arguments: [], argumentString: ""};
        res.push(hashtag);
      } else {
        throw new SyntaxError("A HashTag must start with a keyword.");
      }
    }
    if (one === ".") {
      if (two === "w" || two === "'") {
        hashtag.arguments.push(w);
        hashtag.argumentString += "." + w;
      } else {
        throw new SyntaxError(
          "A HashTag argument starting with . must be followed by a digitword or a \"/'string."
        );
      }
    }
    if (one !== "." && one !== "#") {
      throw new SyntaxError(
        "A HashDot sequence must begin with either a '#' or a '.'"
      );
    }
    one = undefined;
  }
  return res;
}
```
As a running function it looks like this:
```javascript
const test = "#shoes.42.black#menswear#search.'socks'";
let res = parseHashDots(test);
res === [
  {
    keyword: "shoes",
    signature: "shoes/2",
    arguments: ["42", "black"],
    argumentString: ".42.black"
  }, {
    keyword: "menswear",
    signature: "menswear/0",
    arguments: [],
    argumentString: ""
  }, {
    keyword: "search",
    signature: "search/1",
    arguments: ["'socks'"],
    argumentString: ".'socks'"
  }
];
```
For now, HashDots is strict and unforgiving. Attempting to parse these hashlocations will throw an Error.
```javascript
parseHashDots("#no #whitespace #inBetween");
parseHashDots("#no##missing.keywords");
parseHashDots("#no#missing..arguments");
parseHashDots("#no#illegal.characters?%&!¤,;:-_");
```

# References

 * [HTML spec on links](https://www.w3.org/TR/html4/struct/links.html)
 * [path-to-regexp](https://github.com/pillarjs/path-to-regexp)
 * [Article on routing](http://krasimirtsonev.com/blog/article/deep-dive-into-client-side-routing-navigo-pushstate-hash)
 * [Video on routing strategies](https://codecraft.tv/courses/angular/routing/routing-strategies/)
 * [Demo of pushstate and popstate](https://geeklaunch.net/pushstate-and-popstate/)
 
 
## Draft, should I put in this in this chapter??

> Parsing #-location as if it was a path location = to spoof the path location.
> This is discussed under MPA router.

Systems relying on both the path and the #-tag of URLs will likely need to implement a parser
like [path-to-regex](https://github.com/pillarjs/path-to-regexp) on the client.
But, system relying on #-tag will also need to implement relative linking in some instances where
regular path-based navigation do not.

 