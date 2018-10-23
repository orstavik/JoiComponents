export function parseHashDots(hashString) {

  function tokenType(c) {
    if (c === "'" || c === '"') return "'";
    if (/[\w]/.test(c)) return "w";
    if (c === "#" || c === "." || c === ":" || c === "*") return c;
    return "u";
  }

  const toks = /("|')((?:\\\1|(?:(?!\1).))*)\1|\.|:|\*|#|[\w]+/g;
  const res = [];
  let one = undefined;
  let hashtag;

  for (let t = toks.exec(hashString); t !== null; t = toks.exec(hashString)) {
    let w = t[0];
    let two = tokenType(w[0]);
    if (!one) {
      one = two;
      continue;
    }
    if (one === "#") {
      if (two === "w") {
        hashtag = {keyword: w, arguments: [], argumentTypes: [], argumentString: ""};
        res.push(hashtag);
      } else {
        throw new SyntaxError("A HashTag must start with a keyword.");
      }
    }
    else if (one === ":" && two === "*"){
      if (!hashtag)
        throw new SyntaxError("A HashDot must start with a keyword, it .");
      if (hashtag.arguments.length)
        throw new SyntaxError("A HashDot with can either have normal arguments or universal arguments ");
      hashtag.universalArguments = true;
    }
    else if (one === "." || one === ":") {
      if (hashtag.universalArguments )
        throw new SyntaxError("A HashDot with can either have normal arguments or universal arguments ");
      if (two === "w" || two === "'") {
        hashtag.arguments.push(w);
        hashtag.argumentTypes.push(one);
        hashtag.argumentString += "." + w;
      } else {
        throw new SyntaxError(
          "A HashDot argument starting with . must be followed by a digitword or a \"/'string."
        );
      }
    }
    else {
      throw new SyntaxError(
        "A HashDot sequence must begin with either a '#' or a '.'"
      );
    }
    one = undefined;
  }
  for (let hashtag of res)
    hashtag.signature = hashtag.keyword + "/" + hashtag.arguments.length;
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