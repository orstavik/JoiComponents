export function parseHashDots(input) {
  if (!input.startsWith("#"))
    throw new SyntaxError(`HashDot sequence must start with #.\nInput:  ${input}\nError:  ↑`);
  const hashOrDot = /#[\w]+|\.[\w]+|::?[\w]+|\."((?:\\"|(?:(?!").))*)"|\.'((?:\\'|(?:(?!').))*)'|(((.+)))/g;
  const tags = [];
  const map = {};
  let key;
  for (let next; (next = hashOrDot.exec(input)) !== null;) {
    if (next[3]) {
      const errorPos = hashOrDot.lastIndex - next[3].length + 1;
      throw new SyntaxError(`HashDot syntax error:\nInput:  ${input}\nError:  ${Array(errorPos).join(" ")}↑`);
    }
    if (next[0].startsWith("#")) {
      key = next[0];
      if (map[key]) {
        const errorPos = hashOrDot.lastIndex - next[0].length + 1;
        throw new SyntaxError(`HashDot syntax error: A HashDot sequence cannot have two tags with the same name:\nInput:  ${input}\nError:  ${Array(errorPos).join(" ")}↑`);
      }
      map[key] = [];
      tags.push(key);
    } else if (next[0].startsWith("::")) {
      if (map[key].length) {
        const errorPos = hashOrDot.lastIndex - next[0].length + 1;
        throw new SyntaxError(`HashDot syntax error. DoubleDots '::' must be the only argument:\nInput:  ${input}\nError:  ${Array(errorPos).join(" ")}↑`);
      }
      map[key] = next[0];
    } else {
      if (map[key] instanceof String) {
        const errorPos = hashOrDot.lastIndex - next[0].length + 1;
        throw new SyntaxError(`HashDot syntax error. DoubleDots '::' must be the only argument:\nInput:  ${input}\nError:  ${Array(errorPos).join(" ")}↑`);
      }
      map[key].push(next[0]);
    }
  }
  return {tags, map};
}

function checkAndAddToVarMap(a, b, varMap) {
  let aValue;
  for (aValue = a; varMap[aValue]; aValue = varMap[aValue]) ;
  if (!Array.isArray(aValue) && aValue.startsWith(":")) {
    varMap[aValue] = b;
    return true;
  }
  let bValue;
  for (bValue = b; varMap[bValue]; bValue = varMap[bValue]) ;
  if (!Array.isArray(bValue) && bValue.startsWith(":")) {
    varMap[bValue] = a;
    return true;
  }
  if (a instanceof Array && b instanceof Array) {
    return a.deep.equal(b);
  }
  return a === b;
}

function matchArguments(as, bs, varMap) {
  if (!Array.isArray(as)|| !Array.isArray(bs))
    return checkAndAddToVarMap(as, bs, varMap);
  for (let i = 0; i < as.length; i++)
    if (!checkAndAddToVarMap(as[i], bs[i], varMap))
      return false;
  return true;
}

export function matchTags(left, right) {
  let leftPos = 0;
  let first = right.tags[0];
  while (true) {
    if (left.tags[leftPos] === first)
      break;
    if (leftPos === left.length - 1)
      return null;
    leftPos++;
  }
  let varMappings = {};
  for (let i = 0; i < right.tags.length; i++) {
    let rightTag = right.tags[i];
    let leftTag = left.tags[leftPos + i];
    if (rightTag !== leftTag)
      return null;
    if (!matchArguments(left.map[leftTag], right.map[rightTag], varMappings))
      return null;
  }
  return {leftPos, varMappings};
}

function replace(left, right, startPost, length, varMappings) {
  const tags = [].concat(left.tags);
  tags.splice(startPost, length, ...right.tags);
  return {
    tags,
    map: Object.assign({}, left.map, right.map),
    varMappings
  }
}

function flatten({tags, map, varMappings}) {
  const flatMap = {};
  for (let tag of tags) {
    let args = map[tag];
    if (!Array.isArray(args))
      for (; varMappings[args]; args = varMappings[args]) ;
    if (!Array.isArray(args))
      flatMap[tag] = args;
    else {
      flatMap[tag] = [];
      for (let arg of args) {
        for (; varMappings[arg]; arg = varMappings[arg]) ;
        flatMap[tag].push(arg);
      }
    }
  }
  return {tags, map: flatMap, varMappings};
}

export function hashDotsToString({tags, map, varMappings}){
  let flat = flatten({tags, map, varMappings});
  let str = "";
  for (let tag of flat.tags) {
    str+=tag;
    let args = flat.map[tag];
    if (args instanceof String)
      str+=args;
    else
      for (let arg of args) str += arg;
  }
  return str;
}

export function mapHashDots(parsed) {
  const tree = parsed.tree;
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
  return {tree, params, map: parsed.map || map, typesMap};
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
  return mapHashDots({tree: newDots});
}

function resolve(leftSide, middleSide, rightSide) {
  for (let i = 0; i < middleSide.length; i++) {
    const middleHashDots = middleSide[i];
    const match = matchTags(leftSide, middleHashDots);
    if (match)
      return replace(leftSide, rightSide[i], match.leftPos, middleHashDots.tags.length, match.varMappings);
  }
  return leftSide;
}

function resolveOld(leftSide, middleSide, rightSide) {
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
    this.leftRules = Object.keys(routeMap).map(str => parseHashDots(str));
    this.rightRules = Object.values(routeMap).map(str => parseHashDots(str));
  }

  right(hashdots) {
    return resolve(parseHashDots(hashdots), this.leftRules, this.rightRules);
  }

  left(hashdots) {
    return resolve(parseHashDots(hashdots), this.rightRules, this.leftRules);
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