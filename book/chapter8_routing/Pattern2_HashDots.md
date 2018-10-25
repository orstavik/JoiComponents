# Pattern: HashDots

## Alternative 1: HashAndSlash

Many SPA that use page-internal-links today follow this recipe:
1. Convert path+argument data into a `/`-based format.
   The `/`-notation makes the links *look* normal, even though they are not.
2. Add `#` or `#!` infront of the `/`-based location.
   This `#` would not belong in a normal `/`-based location, and 
   this makes the composed **HashAndSlash** link look slightly different and thus suspicious.
3. Convert the `/`-based link back out into path+argument data.
   This often require the parser to be aware of semantic properties of the different segments
   in the links as some segments might be path names while other argument values.
   
The **HashAndSlash** approach has two major drawbacks.
First, it looks familiar, but different. Uncanny. 
To add a deeper syntax would break even more with established convention,
thus the `/`-format is kept unary and flat.

Second, double conversion. 
It requires conversion of key/value-pairs into a flat, unary `/`-delineated format,
*and* back again.
                          
In the [SlashMPA](todo) chapter, we will describe in detail how paths and arguments can be converted
in and out of the flat, unary `/`-delineated format.

## Alternative 2: HashDots

> Why? Familiarity. You don't want the link to look strange.

The HashAndSlash approach search for familiarity *inside* established convention for web app navigation.
But, it is possible to find familiarity *outside* this cultural domain too.
Today, the `#` symbol is primarily associated with hashtags in social media.
Hashtags is a means for *thematic* linking and navigation.
This external convention can be drawn upon to create new familiarity for the user, 
which would ease adoption and lessen suspicion.

When we apply the hashtag convention to internal navigation in an app,
several route notation premises are turned upside down:

1. Singularity vs. plurality
   * `/`-path segments combine to point to a single name. But many segment names only yield one location.
   You only get one outcome from multiple `/`-segments such as `/this/is/a/single.file`.
   * Individual `#`-tags also point to a single theme, but multiple `#`-tags points to multiple themes.
   A tweet can contain an array of `#`-tags such as `tweet! #thinkingOutsideTheBox #moreIsMerrier`.
   * App internal navigation using hashtags should therefore embrace plurality conceptually.
   An app internal link can contain many hashtags, and the route itself can be used to compose
   unique instances of the view.
   On the conversion side, allowing the router *not to* squeeze multiple entries into a singular output
   also reduces the processing effort.

2. Page vs. component
   * The archetype of a path segment is a folder or a file.
   * The archetype of a hashtag is a keyword.
   * In app internal navigation, using keywords to point to key components fits.
   This also corresponds nicely with the composition principle above: 
   A path is a composition of one or more components.

3. Flat vs. deep.
   * The morphology of segment folders is flat, a folder only has a name.
   However, the morphology of segment files is deep. The `.` in a filename divide 
   the name from the file type(s) and can be nested several levels deep (cf. `script.min.js.map.tar.gz`).
   * The morphology of hashtags is flat. 
   * When we merge the convention of hashtags into url, can we also merge the convention of `.` in 
   filenames into hashtags? Would `https://app.shoestore.com/#marathon.42` make sense? 
   My personal opinion is that it does.

This new, hybrid format we call **HashDots**.

## Parsing HashDots

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

 * 
 
## Draft, should I put in this in this chapter??

> Parsing #-location as if it was a path location = to spoof the path location.
> This is discussed under MPA router.

Systems relying on both the path and the #-tag of URLs will likely need to implement a parser
like [path-to-regex](https://github.com/pillarjs/path-to-regexp) on the client.
But, system relying on #-tag will also need to implement relative linking in some instances where
regular path-based navigation do not.

 