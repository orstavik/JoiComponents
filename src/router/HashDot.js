function pureSplice(origin, start, stop, added) {
  const tags = [].concat(origin);
  tags.splice(start, stop, ...added);
  return tags;
}

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

  flattenArgs(varMap) {
    const res = [];
    for (let i = 0; i < this.flatArgs.length; i++) {
      let flat = this.flatArgs[i];
      res.push(flat ? flat : resolveVariable(this.args[i], varMap));
    }
    return res;
  }

  flatten(varMap) {
    let flat = new HashDot(this.tagName, this.tagValue);
    flat.args = flattenArgs(this.args, varMap);// this.flattenArgs(varMap);
    return flat;
  }

  //todo make varMap immutable?
  //todo should matchArguments use the flatValues??
  match(otherDot, varMap) {
    if (this.tagValue !== otherDot.tagValue)
      return false;
    if (!matchArguments(this.args, otherDot.args, varMap))
      return false;
    return varMap;
  }

  toString() {
    return this.tagName + (Array.isArray(this.args) ? this.args.join("") : this.args);
  }
}

function flattenArgs(args, varMappings) {
  if (!Array.isArray(args))
    args = resolveVariable(args, varMappings);
  return Array.isArray(args) ? args.map(arg => resolveVariable(arg, varMappings)) : args;
}

export class HashDots {
  static parse(input) {
    const varCounter = variableCounter++;
    input = input.trim();
    if (!(input.startsWith("#") || input.startsWith("/") || input.startsWith("!")))
      throw new SyntaxError(`HashDot sequence must start with #,!, or /.\nInput:  ${input}\nError:  ↑`);
    const hashOrDot = /[#/!]+([\w]+)|\.([\w]+)|\."((\\.|[^"])*)"|\.'((\\.|[^'])*)'|::?[\w]+|<=>|\s+|(.+)/g;
    const rule = {left: {tags: [], flatTags: [], args: [], flatArgs: [], dots: []}};
    // let tags = rule.left.tags;
    // let args = rule.left.args;
    // let flatTags = rule.left.flatTags;
    // let flatArgs = rule.left.flatArgs;
    let dots = rule.left.dots;
    let tagPos = -1, argPos = 0, dot;
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
        rule.right = {tags: [], flatTags: [], args: [], flatArgs: [], dots: []};
        // tags = rule.right.tags;
        // args = rule.right.args;
        // flatTags = rule.right.flatTags;
        // flatArgs = rule.right.flatArgs;
        dots = rule.right.dots;
        dot = undefined;
        tagPos = -1;
        continue;
      }
      if (word.startsWith("#") || word.startsWith("/") || word.startsWith("!")) {
        ++tagPos;
        // tags[tagPos] = word;
        // args[tagPos] = [];
        // flatTags[tagPos] = flat;
        // flatArgs[tagPos] = [];
        argPos = 0;
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
      if (word.startsWith("::")) {
        // if (argPos !== 0) {
        //   const errorPos = hashOrDot.lastIndex - word.length + 1;
        //   throw new SyntaxError(`HashDot syntax error. DoubleDots '::' must be the only argument:\nInput:  ${input}\nError:  ${Array(errorPos).join(" ")}↑`);
        // }
        // args[tagPos] = word + "-" + varCounter;
        argPos++;
        continue;
      }
      if (word.startsWith(":")) {
        word += "-" + varCounter;
      }
      // args[tagPos][argPos] = word;
      // flatArgs[tagPos][argPos++] = flat;
    }
    // if (rule.right === undefined)
    //   return rule.left;
    return rule;
  }

  static subsetMatch(left, right) {
    for (let i = 0; i < left.dots.length; i++) {
      let leftDot = left.dots[i];
      // let leftArgs = left.dots[i];
      for (let j = 0; j < right.dots.length; j++) {
        let varMap = {};
        let rightDot = right.dots[j];
        // let rightArgs = right.args[j];
        if (leftDot.match(rightDot, varMap)) {
          varMap = HashDots.headMatch(left, right, i, j, varMap);
          if (varMap)
            return {start: i, stop: right.tags.length, varMap};
        }
      }
    }
    return null;
  }

  static headMatch(left, right, i, j, varMap) {
    if (i + right.dots.length > left.dots.length)
      return null;
    for (let k = 1; k < right.dots.length; k++) {
      let rightDot = right.dots[j + k];
      let leftDot = left.dots[i + k];
      // let leftArgs = left.args[i+k];
      // let rightArgs = right.args[j+k];
      if (!leftDot.match(rightDot, varMap))//rightTag !== leftTag || !matchArguments(leftArgs, rightArgs, varMap))
        return null;
    }
    return varMap;
  }

  static toString({dots}) {
    let str = "";
    for (let i = 0; i < dots.length; i++) {
      let dot = dots[i];
      str += dot.toString();
      // let args2 = args[i];
      // if (varMap)
      //   args2 = flattenArgs(args2, varMap);
      // str += tag;
      // if (Array.isArray(args2))
      //   for (let arg of args2) str += arg;
      // else
      //   str += args2.substring(0, args2.indexOf("-"));
    }
    return str;
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
    for (let rule of rules) {
      const match = HashDots.subsetMatch(leftSide, rule.left);
      if (match) {
        //todo can I avoid merging and HashDots.flattening here??
        let dots = pureSplice(leftSide.dots, match.start, match.stop, rule.right.dots);
        dots = dots.map(dot => dot.flatten(match.varMap));
        //todo how to flatten dots
        // let tags = pureSplice(leftSide.tags, match.start, match.stop, rule.right.tags);
        // let args = pureSplice(leftSide.args, match.start, match.stop, rule.right.args);
        // args = args.map(args => flattenArgs(args, match.varMap));
        return HashDotMap.resolve({dots}, rules);
      }
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
    this.map = new HashDotMap(routes);
    window.addEventListener("hashchange", () => this._onHashchange());
    //dispatch an initial routechange event at the first raf after startup
    requestAnimationFrame(() => this._onHashchange());
  }

  _onHashchange() {
    let currentHash = window.location.hash;
    if (this.middle === currentHash || this.left === currentHash || this.right === currentHash)
      return window.location.hash = this.left;
    const middle = HashDots.parse(currentHash).left;
    let left = this.map.left(middle);
    let leftStr = HashDots.toString(left);
    if (leftStr === this.left)
      return window.location.hash = this.left;
    let right = this.map.right(middle);
    let rightStr = HashDots.toString(right);
    this.left = leftStr;
    this.right = rightStr;
    this.middle = currentHash;
    this.lastEvent = {left, middle, right};
    window.location.hash = leftStr;
    window.dispatchEvent(new CustomEvent("routechange", {detail: this.lastEvent}));
  }
}