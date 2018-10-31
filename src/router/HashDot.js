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

function resolveVariable(key, map){
  let next;
  while(next = map[key])
    key = next;
  return key;
}

//todo, I need to ensure that in the varMap, I name the left and right side differently entities, so that they don't coincidentally mix.
//todo how best to do this, I don't know..
function checkAndAddToVarMap(a, b, varMap) {
  a = resolveVariable(a, varMap);
  if (a.startsWith(":"))
    return varMap[a] = b;
  b = resolveVariable(b, varMap);
  if (b.startsWith(":"))
    return varMap[b] = a;
  return a === b;
}

function matchArguments(as, bs, varMap) {
  as = resolveVariable(as, varMap);
  if (!Array.isArray(as))
    return varMap[as] = bs;
  bs = resolveVariable(bs, varMap);
  if (!Array.isArray(bs))
    return varMap[bs] = as;
  //todo add test when the length of bs is longer than the length of as
  if (as.length !== bs.length)
    return false;
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
  const matchLength = right.tags.length;
  for (let i = 0; i < matchLength; i++) {
    let rightTag = right.tags[i];
    let leftTag = left.tags[leftPos + i];
    if (rightTag !== leftTag)
      return null;
    if (!matchArguments(left.map[leftTag], right.map[rightTag], varMappings))
      return null;
  }
  return {leftPos, varMappings, matchLength};
}

function replace(left, right, match) {
  const tags = [].concat(left.tags);           //todo make a better splice: Array.prototype.splice.call([], ...) ??
  tags.splice(match.leftPos, match.matchLength, ...right.tags);
  return {
    tags,
    map: Object.assign({}, left.map, right.map),
    varMappings:match.varMappings
  }
}

function flatten(tags, map, varMappings) {
  const flatMap = {};
  for (let tag of tags) {
    let args = resolveVariable(map[tag], varMappings);
    flatMap[tag] = Array.isArray(args) ? args.map(arg => resolveVariable(arg, varMappings)) : args;
  }
  return {tags, map: flatMap};
}

export function hashDotsToString({tags, map, varMappings}) {
  let flat = flatten(tags, map, varMappings);
  let str = "";
  for (let tag of flat.tags) {
    str += tag;
    let args = flat.map[tag];
    if (Array.isArray(args))
      for (let arg of args) str += arg;
    else
      str += args;
  }
  return str;
}

function resolve(leftSide, middleSide, rightSide) {
  for (let i = 0; i < middleSide.length; i++) {
    const middleHashDots = middleSide[i];
    const match = matchTags(leftSide, middleHashDots);
    if (match)
      return replace(leftSide, rightSide[i], match);
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
    window.dispatchEvent(new CustomEvent("routechange", {detail: parsedDots}));
  }
}