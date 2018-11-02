const flatValues = {};              //todo this is locking in all strings forever..
export function flatValue(key) {
  let old = flatValues[key];
  if (old)
    return old;
  if (key.startsWith(".'"))
    return flatValues[key] = key.substring(2, key.length - 1).replace(/\\'/, "'");
  if (key.startsWith('."'))
    return flatValues[key] = key.substring(2, key.length - 1).replace(/\\"/, '"');
  return flatValues[key] = key.substring(1);
}

let variableCounter = 0;
export function parseHashDots(input) {
  const varCounter = variableCounter++;
  if (!input.startsWith("#"))
    throw new SyntaxError(`HashDot sequence must start with #.\nInput:  ${input}\nError:  ↑`);
  const hashOrDot = /#[\w]+|\.[\w]+|::?[\w]+|\."(\\.|[^"])*"|\.'(\\.|[^'])*'|\s*(<=>)\s*|(.+)/g;
  const rule = {left: {tags: [], map: {}}};
  let tags = rule.left.tags;
  let map = rule.left.map;
  let key;
  for (let next; (next = hashOrDot.exec(input)) !== null;) {
    if (next[4]) {
      const errorPos = hashOrDot.lastIndex - next[4].length + 1;
      throw new SyntaxError(`HashDot syntax error:\nInput:  ${input}\nError:  ${Array(errorPos).join(" ")}↑`);
    }
    if (next[3] === "<=>") {
      rule.right = {tags: [], map: {}};
      tags = rule.right.tags;
      map = rule.right.map;
      key = undefined;
    } else if (next[0].startsWith("#")) {
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
      map[key] = next[0] + "-" + varCounter;
    } else {
      if (map[key] instanceof String) {
        const errorPos = hashOrDot.lastIndex - next[0].length + 1;
        throw new SyntaxError(`HashDot syntax error. DoubleDots '::' must be the only argument:\nInput:  ${input}\nError:  ${Array(errorPos).join(" ")}↑`);
      }
      if (next[0].startsWith(":")) {
        map[key].push(next[0] + "-" + varCounter);
      } else {  //"."
        map[key].push(next[0]);
      }
    }
  }
  return rule;
}

function resolveVariable(key, map) {
  let next;
  while (next = map[key])
    key = next;
  return key;
}

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

export function matchTags(left, right, varMap) {
  let start = 0;
  let first = right.tags[0];
  while (true) {
    if (left.tags[start] === first)
      break;
    if (start === left.tags.length - 1)
      return null;
    start++;
  }
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
      str += args.substring(0, args.indexOf("-"));
  }
  return str;
}

function resolve(leftSide, rules, varMap) {
  for (let rule of rules) {
    const match = matchTags(leftSide, rule.left, varMap);
    if (match) {
      //todo can I avoid merging and flattening here??
      const merged = replace(leftSide, rule.right, match);
      const flat = flatten(merged.tags, merged.map, merged.varMap);
      return resolve(flat, rules, {});
    }
  }
  return leftSide;
}

export class HashDotsRouteMap {
  constructor(routeMap) {
    this.rules = routeMap.map(str => parseHashDots(str));
    this.reverseRules = this.rules.map(rule => ({left: rule.right, right: rule.left}));
  }

  right(hashdots) {
    return this.rightParsed(parseHashDots(hashdots).left);
  }

  left(hashdots) {
    return this.leftParsed(parseHashDots(hashdots).left);
  }

  rightParsed(middle) {
    return resolve(middle, this.rules, {});
  }

  leftParsed(middle) {
    return resolve(middle, this.reverseRules, {});
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
    const middle = parseHashDots(currentHash).left;
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