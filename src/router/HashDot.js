export function parseHashDots(input) {
  if (!input.startsWith("#"))
    throw new SyntaxError(`HashDot sequence must start with #.\nInput:  ${input}\nError:  ↑`);
  const hashOrDot = /#[\w]+|\.[\w]+|::?[\w]+|\."(\\.|[^"])*"|\.'(\\.|[^'])*'|(((.+)))/g;
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

export function getArgumentValue(map, tag, argNr) {
  // if (argNr < 0)
  //   return undefined;
  const args = map["#" + tag];
  if (!Array.isArray(args) || argNr >= args.length)
    return undefined;
  let arg = args[argNr];
  if (arg.startsWith(":"))
    return undefined;
  if (arg.startsWith(".'") || arg.startsWith('."')) {
    arg = arg.substring(2, arg.length-1);
    arg = arg.replace(/\\(.)/g, "$1");
  } else {
    arg = arg.substring(1);
  }
  return arg;
}

function resolveVariable(key, map) {
  let next;
  while (next = map[key])
    key = next;
  return key;
}

//todo, I need to ensure that in the varMap, I name the left and right side differently entities, so that they don't coincidentally mix.
//todo how best to do this, I don't know..
//todo I think the breaking test looks like this
// #one:A#two.b <=> #one.c#two:A
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
  if (as.length !== bs.length)
    return false;
  for (let i = 0; i < as.length; i++)
    if (!checkAndAddToVarMap(as[i], bs[i], varMap))
      return false;
  return true;
}

export function matchTags(left, right) {
  let start = 0;
  let first = right.tags[0];
  while (true) {
    if (left.tags[start] === first)
      break;
    if (start === left.tags.length - 1)
      return null;
    start++;
  }
  let varMap = {};
  const stop = right.tags.length;
  for (let i = 0; i < stop; i++) {
    let rightTag = right.tags[i];
    let leftTag = left.tags[start + i];
    if (rightTag !== leftTag)
      return null;
    if (!matchArguments(left.map[leftTag], right.map[rightTag], varMap))
      return null;
  }
  return {start, stop, varMap};
}

function replace(left, right, match) {
  const tags = [].concat(left.tags);           //todo make a better splice: Array.prototype.splice.call([], ...) ??
  tags.splice(match.start, match.stop, ...right.tags);
  return {
    tags,
    map: Object.assign({}, left.map, right.map),
    varMap: match.varMap
  }
}

function flatten(tags, map, varMappings) {
  if (!varMappings)
    return {tags, map};
  const flatMap = {};
  for (let tag of tags) {
    let args = map[tag];
    if (!Array.isArray(args)) args = resolveVariable(args, varMappings);
    flatMap[tag] = Array.isArray(args) ? args.map(arg => resolveVariable(arg, varMappings)) : args;
  }
  return {tags, map: flatMap};
}

export function hashDotsToString({tags, map, varMap}) {
  let flat = flatten(tags, map, varMap);
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

//todo pass in a varMap here instead that can be used by the matchTags
function resolve(leftSide, middleSide, rightSide) {
  for (let i = 0; i < middleSide.length; i++) {
    const middleHashDots = middleSide[i];
    const match = matchTags(leftSide, middleHashDots);
    if (match){
      const merged = replace(leftSide, rightSide[i], match);
      return resolve(flatten(merged.tags, merged.map, merged.varMap), middleSide, rightSide);
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
    return this.rightParsed(parseHashDots(hashdots));
  }

  left(hashdots) {
    return this.leftParsed(parseHashDots(hashdots));
  }

  rightParsed(middle) {
    return resolve(middle, this.leftRules, this.rightRules);
  }

  leftParsed(middle) {
    return resolve(middle, this.rightRules, this.leftRules);
  }
}

export class HashDotsRouter {
  constructor(routes) {
    this.middle = undefined;
    this.left = undefined;
    this.right = undefined;
    this.lastEvent = null;
    this.map = new HashDotsRouteMap(routes);
    window.addEventListener("hashchange", () => this._onHashchange());
    //dispatch an initial routechange event at the first raf after startup
    requestAnimationFrame(() => this._onHashchange());
  }

  _onHashchange() {
    let currentHash = window.location.hash;
    if (this.middle === currentHash || this.left === currentHash || this.right === currentHash)
      return window.location.hash = this.left;
    const middle = parseHashDots(currentHash);
    let left = this.map.leftParsed(middle);
    let leftStr = hashDotsToString(left);
    if (leftStr === this.left)
      return window.location.hash = this.left;
    let right = this.map.rightParsed(middle);
    let rightStr = hashDotsToString(right);
    this.left = leftStr;
    this.right = rightStr;
    this.middle = currentHash;
    this.lastEvent = {left, middle, right};
    window.location.hash = leftStr;
    window.dispatchEvent(new CustomEvent("routechange", {detail: this.lastEvent}));
  }
}