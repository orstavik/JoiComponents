function wordType(c) {
  if (c === "'" || c === '"') return "'";
  if (/[\w]/.test(c)) return "w";
  return "u";
}

export function parseHashDots(hashString) {
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
        hashdot = {keyword: two, arguments: [], argumentTypes: []};
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

export function mapHashDots(tree) {
  const map = {};
  const typesMap = {};
  const params = {};
  for (let hashdot of tree) {
    for (let i = 0; i < hashdot.arguments.length; i++) {
      let arg = hashdot.arguments[i];
      let argType = hashdot.argumentTypes[i];
      if (argType === "?" && hashdot.arguments.length > 1)
        throw new SyntaxError("A HashDot can only contain a single universal parameter '?'.\nNot a sequence of either arguments '.something' and/or parameters ':A', not both.");
      if (argType === "?" || argType === ":") {
        const key = argType + arg;
        params[key] || (params[key] = {type: argType, name: arg, keyword: hashdot.keyword, position: i});
        //todo this is wrong, I need to add more positions if an argument is used several places on one side.
      }
    }
    map[hashdot.keyword] = hashdot.arguments;
    typesMap[hashdot.keyword] = hashdot.argumentTypes;
  }
  return {tree, params, map, typesMap};
}

function ruleMatches(hashLeft, hashMiddle) {
  if (hashLeft.keyword !== hashMiddle.keyword)
    return false;
  if (hashMiddle.arguments.length === 1 && hashMiddle.argumentTypes[0] === "?")
    return true;
  return hashMiddle.arguments.length === hashLeft.arguments.length;

}

function cloneHashDot(oldDot) {
  let newDot = Object.assign({}, oldDot);
  newDot.arguments = [].concat(oldDot.arguments);
  newDot.argumentTypes = [].concat(oldDot.argumentTypes);
  return newDot;
}

function resolveHashDots(start, middle, end, i) {
  const newDots = [];
  for (let j = 0; j < i; j++)
    newDots.push(cloneHashDot(start.tree[j]));
  for (let j = 0; j < end.tree.length; j++) {
    let newDot = cloneHashDot(end.tree[j]);
    for (let k = 0; k < newDot.argumentTypes.length; k++) {
      let rightType = newDot.argumentTypes[k];
      if (rightType === ".")
        continue;
      let rightValue = newDot.arguments[k];
      let middleParam = middle.params[rightType + rightValue];
      //resolve multiparam
      if (rightType === "?") {
        newDot.arguments = [].concat(start.map[middleParam.keyword]);
        newDot.argumentTypes = [].concat(start.typesMap[middleParam.keyword]);
      } else
      //resolve singleparams
      if (rightType === ":") {
        newDot.arguments[k] = start.map[middleParam.keyword][middleParam.position];
        newDot.argumentTypes[k] = start.typesMap[middleParam.keyword][middleParam.position];
      }
    }
    newDots.push(newDot);
  }
  i += middle.tree.length;
  for (; i < start.tree.length; i++)
    newDots.push(cloneHashDot(start.tree[i]));
  return mapHashDots(newDots);
}

function resolve(leftSide, middleSide, rightSide) {
  const leftHashDots = leftSide.tree;
  for (let j = 0; j < leftHashDots.length; j++) {
    rule: for (let i = 0; i < middleSide.length; i++) {
      const middleHashDots = middleSide[i].tree;
      for (let n = 0; n < middleHashDots.length; n++) {
        if (!ruleMatches(leftHashDots[j + n], middleHashDots[n])) //the next hashdot in the rule fails
          continue rule;
      }
      const resolved = resolveHashDots(leftSide, middleSide[i], rightSide[i], j);
      return resolve(resolved, middleSide, rightSide);
    }
  }
  return leftSide;
}

export class HashDotsRouteMap {
  constructor(routeMap) {
    this.leftRules = Object.keys(routeMap).map(str => mapHashDots(parseHashDots(str)));
    this.rightRules = Object.values(routeMap).map(str => mapHashDots(parseHashDots(str)));
  }

  right(hashdots) {
    return resolve(mapHashDots(parseHashDots(hashdots)), this.leftRules, this.rightRules);
  }

  left(hashdots) {
    return resolve(mapHashDots(parseHashDots(hashdots)), this.rightRules, this.leftRules);
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
    const parsedDots = parseHashDots(currentHash);
    let hashdots = mapHashDots(parsedDots);
    window.dispatchEvent(new CustomEvent("routechange", {detail: hashdots}));
  }
}