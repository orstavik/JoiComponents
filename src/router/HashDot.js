function resolveVariable(key, map) {
  let next;
  while (next = map[key])
    key = next;
  return key;
}

function matchArgument(a, b, varMap) {
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
    if (!matchArgument(as[i], bs[i], varMap))
      return false;
  return true;
}

let variableCounter = 0;


class HashDot {
  constructor(full, flat) {
    this.tagName = full;
    this.tagValue = flat;
    this.args = [];
    this.flatArgs = [];
  }

  addArgument(full, flat, varCounter) {
    if (!this.args.length && full.startsWith("::"))
      return this.args = full + "-" + varCounter;
    if (this.args.length && (full.startsWith("::") || !Array.isArray(this.args)))
      throw new Error(`DoubleDots '::' must be the only argument.`);
    if (full.startsWith(":"))
      full += "-" + varCounter;
    this.args.push(full);
    this.flatArgs.push(flat);
  }

  flatten(varMap) {
    let flat = new HashDot(this.tagName, this.tagValue);
    flat.args = this.args;
    if (!Array.isArray(flat.args))
      flat.args = resolveVariable(flat.args, varMap);
    flat.args =  Array.isArray(flat.args) ? flat.args.map(arg => resolveVariable(arg, varMap)) : flat.args;
    return flat;
  }

  //todo 1: make match return a new hybrid HashDot?
  //todo 2: this hybrid uses the args of the left, but fills its flatArg values for variables with the right side?
  //todo 3: or does this hybrid object use a varMap?
  //todo make varMap immutable?
  //todo should matchArguments use the flatValues??
  match(otherDot, varMap) {
    return this.tagValue === otherDot.tagValue && matchArguments(this.args, otherDot.args, varMap);
  }

  toString() {
    return this.tagName + (Array.isArray(this.args) ? this.args.join("") : this.args);
  }
}

export class HashDots {
  static parse(input) {
    const varCounter = variableCounter++;
    input = input.trim();
    if (!(input.startsWith("#") || input.startsWith("/") || input.startsWith("!")))
      throw new SyntaxError(`HashDot sequence must start with #,!, or /.\nInput:  ${input}\nError:  ↑`);
    const hashOrDot = /[#/!]+([\w]+)|\.([\w]+)|\."((\\.|[^"])*)"|\.'((\\.|[^'])*)'|::?[\w]+|<=>|\s+|(.+)/g;
    const rule = {left: []};
    let dots = rule.left;
    let dot;
    for (let next; (next = hashOrDot.exec(input)) !== null;) {
      if (next[7]) {
        const errorPos = hashOrDot.lastIndex - next[7].length + 1;
        throw new SyntaxError(`HashDot syntax error:\nInput:  ${input}\nError:  ${Array(errorPos).join(" ")}↑`);
      }
      let word = next[0];
      let flat = next[1] || next[2] || (next[3] && next[3].replace(/\\"/, '"')) || (next[5] && next[5].replace(/\\'/, "'"));
      if (word[0].match(/\s/))
        continue;
      if (word === "<=>") {
        rule.right = [];
        dots = rule.right;
        dot = undefined;
        continue;
      }
      if (word.startsWith("#") || word.startsWith("/") || word.startsWith("!")) {
        dots.push(dot = new HashDot(word, flat));
        continue;
      }
      if (dot === undefined) {
        const errorPos = hashOrDot.lastIndex - word.length + 1;
        throw new SyntaxError(`HashDot syntax error. HashDot sequence must start with '#':\nInput:  ${input}\nError:  ${Array(errorPos).join(" ")}↑`);
      }
      try {
        dot.addArgument(word, flat, varCounter);
      } catch (err) {
        const errorPos = hashOrDot.lastIndex - word.length + 1;
        throw new SyntaxError(`HashDot syntax error: ${err.message}\nInput:  ${input}\nError:  ${Array(errorPos).join(" ")}↑`);
      }
    }
    // if (rule.right === undefined)
    //   return rule.left;
    return rule;
  }

  static matchAndReplace(leftSide, rule) {
    const match = HashDots.subsetMatch(leftSide, rule.left);
    if (!match)
      return null;
    //todo can I avoid merging and HashDots.flattening here??
    let res = [].concat(leftSide);
    res.splice(match.start, match.stop, ...rule.right);
    return res.map(dot => dot.flatten(match.varMap));
  }

  static subsetMatch(left, right) {
    for (let i = 0; i < left.length; i++) {
      let leftDot = left[i];
      for (let j = 0; j < right.length; j++) {
        let varMap = {};
        if (leftDot.match(right[j], varMap)) {
          if (HashDots.headMatch(left, right, i, j, varMap))
            return {start: i, stop: right.length, varMap};
        }
      }
    }
    return null;
  }

  static headMatch(left, right, i, j, varMap) {
    if (i + right.length > left.length)
      return false;
    for (let k = 1; k < right.length; k++) {
      if (!left[i + k].match(right[j + k], varMap))
        return false;
    }
    return true;
  }
}

export class HashDotMap {
  constructor(routeMap) {
    this.rules = routeMap.map(str => HashDots.parse(str));
    this.reverseRules = this.rules.map(rule => ({left: rule.right, right: rule.left}));
  }

  right(hashdots) {
    (typeof hashdots === "string" || hashdots instanceof String) && (hashdots = HashDots.parse(hashdots).left);
    return HashDotMap.resolve(hashdots, this.rules);
  }

  left(hashdots) {
    (typeof hashdots === "string" || hashdots instanceof String) && (hashdots = HashDots.parse(hashdots).left);
    return HashDotMap.resolve(hashdots, this.reverseRules);
  }

  static resolve(leftSide, rules) {
    let next;
    for (let rule of rules) {
      if (next = HashDots.matchAndReplace(leftSide, rule))
        return HashDotMap.resolve(next, rules);
    }
    return leftSide;
  }

}

export class HashDotsRouter {
  constructor(routes) {
    this.middle = undefined;
    this.left = undefined;
    this.right = undefined;
    this.lastEvent = null;
    this.rules = new HashDotMap(routes);
    window.addEventListener("hashchange", () => this._onHashchange());
    //dispatch an initial routechange event at the first raf after startup
    requestAnimationFrame(() => this._onHashchange());
  }

  _onHashchange() {
    let currentHash = window.location.hash;
    if (this.middle === currentHash || this.left === currentHash || this.right === currentHash)
      return window.location.hash = this.left;
    const middle = HashDots.parse(currentHash).left;
    let left = this.rules.left(middle);
    let leftStr = left.map(dot => dot.toString()).join("");
    if (leftStr === this.left)
      return window.location.hash = this.left;
    let right = this.rules.right(middle);
    this.left = leftStr;
    this.right = right.map(dot => dot.toString()).join("");
    this.middle = currentHash;
    this.lastEvent = {left, middle, right};
    window.location.hash = leftStr;
    window.dispatchEvent(new CustomEvent("routechange", {detail: this.lastEvent}));
  }
}