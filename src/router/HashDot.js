export function parseHashDots(input) {
  if (!input.startsWith("#"))
    throw new SyntaxError(`HashDot sequence must start with #.\nInput:  ${input}\nError:  ↑`);
  const hashOrDot = /#[\w]+|\.[\w]+|::?[\w]+|\."((?:\\"|(?:(?!").))*)"|\.'((?:\\'|(?:(?!').))*)'|(((.+)))/g;
  const tags = [];
  const map = {};
  let key;
  const tree = [];                                                                  //todo skip
  let hashdot;                                                                      //todo skip
  for (let next; (next = hashOrDot.exec(input)) !== null;) {
    if (next[3]) {
      const errorPos = hashOrDot.lastIndex - next[3].length + 1;
      throw new SyntaxError(`HashDot syntax error:\nInput:  ${input}\nError:  ${Array(errorPos).join(" ")}↑`);
    }
    let type = next[0][1] === ":" ? "::" : next[0][0];
    if (type === "#") {
      hashdot = {keyword: next[0].substring(1), arguments: [], argumentTypes: []};  //todo skip
      tree.push(hashdot);                                                           //todo skip
      tags.push(key = next[0]);
      if (map[key]) {
        const errorPos = hashOrDot.lastIndex - next[0].length + 1;
        throw new SyntaxError(`HashDot syntax error: A HashDot sequence cannot have two tags with the same name:\nInput:  ${input}\nError:  ${Array(errorPos).join(" ")}↑`);
      }
    } else {
      if ((type === "::" && map[key]) || map[key] instanceof String) {
        const errorPos = hashOrDot.lastIndex - next[0].length + 1;
        throw new SyntaxError(`HashDot syntax error. DoubleDots '::' must be the only argument:\nInput:  ${input}\nError:  ${Array(errorPos).join(" ")}↑`);
      }
      if (type === "::") {
        map[key] = next[0];
        hashdot.arguments.push(next[0].substring(type.length));                     //todo skip
        hashdot.argumentTypes.push(type);                                           //todo skip
      } else {
        (map[key] || (map[key] = [])).push(next[0]);
        hashdot.arguments.push(next[0].substring(type.length));                     //todo skip
        hashdot.argumentTypes.push(type);                                           //todo skip
      }
    }
  }
  // return {tree, map, tags};
  return tree;
}

export function mapHashDots(tree) {
  const map = {};
  const typesMap = {};
  const params = {};
  for (let hashdot of tree) {
    for (let i = 0; i < hashdot.arguments.length; i++) {
      let arg = hashdot.arguments[i];
      let argType = hashdot.argumentTypes[i];
      if (argType === "::" || argType === ":") {
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
  if (hashMiddle.arguments.length === 1 && hashMiddle.argumentTypes[0] === "::")
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
      if (rightType === "::") {
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