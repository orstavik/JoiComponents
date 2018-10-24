function wordType(c) {
  if (c === "'" || c === '"') return "'";
  if (/[\w]/.test(c)) return "w";
  return "u";
}

function tokenizeAndParse(hashString) {
  const toks = /("|')((?:\\\1|(?:(?!\1).))*)\1|\.|:|\?|#|[\w]+/g;
  const hashdots = [];
  let hashdot;

  while (true) {
    let t1 = toks.exec(hashString);
    if (t1 === null)
      break;
    let t2 = toks.exec(hashString);
    if (t2 === null)
      throw new SyntaxError("HashDots cannot end with: -->" + t1[0] + "<--.\nFull HashDots string: -->" + hashString + "<--");
    let one = t1[0], two = t2[0];
    let twoType = wordType(two[0]);
    if (one === "#") {
      if (twoType === "w") {
        hashdot = {keyword: two, arguments: [], argumentTypes: [], argumentString: ""};
        hashdots.push(hashdot);
        continue;
      } else {
        throw new SyntaxError("A HashDot must start with #Keyword (#[\\w]+): -->" + one + two + "<--\nFull HashDots string: -->" + hashString + "<--");
      }
    }
    if (!hashdot)
      throw new SyntaxError("A HashDot must start with #Keyword (#[\\w]+): -->" + one + two + "<--\nFull HashDots string: -->" + hashString + "<--");

    if (one === "." || one === ":" || one === "?") {
      if (twoType === "w" || twoType === "'") {
        hashdot.arguments.push(two);
        hashdot.argumentTypes.push(one);
        hashdot.argumentString += one + two;
        continue;
      } else {
        throw new SyntaxError(
          "A HashDot argument value must be an AlpaNumeric or a \"quoted\" 'string'."
        );
      }
    }
    throw new SyntaxError("A HashDot sequence begins with either '#', '.' or ':', not: -->" + one + "<--");
  }
  return hashdots;
}

function makeHashDotsFrame(tree) {
  const map = {};
  const params = {};
  // let signatureString = "";
  for (let hashdot of tree) {
    // signatureString += "#" + hashdot.keyword + "/" + (hashdot.argumentTypes[0] === "?" ? "n" : hashdot.arguments.length);
    for (let i = 0; i < hashdot.arguments.length; i++) {
      let arg = hashdot.arguments[i];
      let argType = hashdot.argumentTypes[i];
      if (argType === "?" && hashdot.arguments.length > 1)
        throw new SyntaxError("A HashDot can only contain a single universal parameter '?'.\nNot a sequence of either arguments '.something' and/or parameters ':A', not both.");
      if (argType === "?" || argType === ":") {
        const key = argType + arg;
        params[key] || (params[key] = {type: argType, name: arg, keyword: hashdot.keyword, position: i});
      }
    }
    hashdot.signature = hashdot.keyword + "/" + hashdot.arguments.length;   //todo maybe remove this
    map[hashdot.keyword] = hashdot.arguments;
  }
  return {map, tree, params};
}

export function parseHashDots(hashString) {
  return makeHashDotsFrame(tokenizeAndParse(hashString));
}

function ruleMatches(hashLeft, hashMiddle) {
  if (hashLeft.keyword !== hashMiddle.keyword)
    return false;
  if (hashMiddle.arguments.length === 1 && hashMiddle.argumentTypes[0] === "?")
    return true;
  return hashMiddle.arguments.length === hashLeft.arguments.length;

}

function hashDotsMerge(left, middle, right, i) {
  //0. make a newHashDots []
  //1. from 0 to i, simply clone the hashDots from left into newHashDots
  //2. on i, then clone each rule in right, then on all parameters, go from right to middle to left to resolve the argument values.
  //3. then add the length of middle to i, and then clone in the rest of left into newHashDots object.
  //4. return makeHashDotsFrame(newHashDots);
}

function resolveLeftToRight(leftSide, rules) {
  const leftHashDots = leftSide.tree;
  for (let i = 0; i < leftHashDots.length; i++) {
    rule: for (let rule of rules) {
      const middleHashDots = rule.left.tree;
      for (let n = 0; n < middleHashDots.length; n++) {
        if (!ruleMatches(leftHashDots[i + n], middleHashDots[n])) //the next hashdot in the rule fails
          continue rule;
      }
      //rules match left side
      let newLeftSide = hashDotsMerge(leftSide, rule.left, rule.right, i);
      return resolveLeftToRight(newLeftSide);
    }
  }
  //no rules applies to this leftSide anymore, return the original
  return leftSide;
}

export class HashDotsRouteMap {
  constructor(routeMap) {
    this.routeMap = routeMap.values().map(entry => ({
      left: parseHashDots(entry[0]),
      right: parseHashDots(entry[1])
    }));
  }

  right(hashdots) {
    const given = parseHashDots(hashdots);
    return resolveLeftToRight(given, this.routeMap);
  }
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