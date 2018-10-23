function tokenType(c) {
  if (c === "'" || c === '"') return "'";
  if (/[\w]/.test(c)) return "w";
  if (c === "#" || c === "." || c === ":" || c === "*") return c;
  return "u";
}

function parse(hashString) {
  const toks = /("|')((?:\\\1|(?:(?!\1).))*)\1|\.|:|\*|#|[\w]+/g;
  const res = [];
  let hashtag;

  while (true) {
    let t1 = toks.exec(hashString);
    if (t1 === null)
      break;
    let t2 = toks.exec(hashString);
    if (t2 === null)
      throw new SyntaxError("HashDots cannot end with: -->" + t1[0] + "<--.\nFull HashDots string: -->" + hashString + "<--");
    let one = t1[0], two = t2[0];
    let twoType = tokenType(two[0]);
    if (one === "#") {
      if (twoType === "w") {
        hashtag = {keyword: two, arguments: [], argumentTypes: [], argumentString: ""};
        res.push(hashtag);
        continue;
      } else {
        throw new SyntaxError("A HashDot must start with #Keyword (#[\\w]+): -->" + one + two + "<--\nFull HashDots string: -->" + hashString + "<--");
      }
    }
    if (!hashtag)
      throw new SyntaxError("A HashDot must start with #Keyword (#[\\w]+): -->" + one + two + "<--\nFull HashDots string: -->" + hashString + "<--");

    if (one === "." || one === ":") {
      if (two === "*") {
        hashtag.universalArguments = true;
      } else if (twoType === "w" || twoType === "'") {
        hashtag.arguments.push(two);
        hashtag.argumentTypes.push(one);
        hashtag.argumentString += one + two;
        continue;
      } else {
        throw new SyntaxError(
          "A HashDot argument value must be an AlpaNumeric or a \"quoted\" 'string'."
        );
      }
    }
    throw new SyntaxError("A HashDot sequence begins with either '#', '.' or ':', not: -->" + one + "<--");
  }
  return res;
}

export function parseHashDots(hashString) {

  const res2 = {};
  const res = parse(hashString);
  for (let hashtag of res) {
    if (hashtag.universalArguments && hashtag.arguments.length)
      throw new SyntaxError("A HashDot can only contain a single universal parameter ':*' or a sequence of either arguments '.something' or parameters ':A', not both.");
    hashtag.signature = hashtag.keyword + "/" + hashtag.arguments.length;
    res2[hashtag.keyword] = hashtag.arguments;
  }
  //res2 is the simple lookup map
  return res;
}

export class HashDotsRouter {
  constructor() {
    this.inputHash = undefined;
    // this.leftHash = undefined;
    // this.rightHash = undefined;
    window.addEventListener("hashchange", this._onHashchange);
    //dispatch an initial routechange event at the first raf after startup
    requestAnimationFrame(() => this._onHashchange());
  }

  _onHashchange() {
    let currentHash = window.location.hash;
    if (this.inputHash === currentHash) //will become this.leftHash === currentHash
      return;
    let hashdots = parseHashDots(currentHash);
    window.dispatchEvent(new CustomEvent("routechange", {detail: hashdots}));
  }
}