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

  static _flattenArgs(args) {
    return args.map(arg => {
      if (arg.startsWith(":"))
        return arg;
      if (arg.startsWith(".'"))
        return arg.substring(2, arg.length - 1).replace(/\\'/, "'");
      if (arg.startsWith('."'))
        return arg.substring(2, arg.length - 1).replace(/\\"/, '"');
      return arg.substring(1);
    });
  }

  flatten(varMap) {
    let flat = new HashDot(this.tagName, this.tagValue);
    flat.args = this.args;
    if (!Array.isArray(flat.args))
      flat.args = resolveVariable(flat.args, varMap);
    if (!Array.isArray(flat.args)) {
      flat.flatArgs = flat.args;
      return flat;
    }
    flat.args = flat.args.map(arg => resolveVariable(arg, varMap));
    flat.flatArgs = HashDot._flattenArgs(flat.args);
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

class MatchResult {
  constructor(input, hitSide, replaceSide, start, stop, varMap) {
    this.input = input;
    this.hitSide = hitSide;
    this.replaceSide = replaceSide;
    this.varMap = varMap;
    this.start = start;
    this.stop = stop;
  }

  static transform(thiz) {
    let res = [].concat(thiz.input);
    res.splice(thiz.start, thiz.stop, ...thiz.replaceSide);
    return res.map(dot => dot.flatten(thiz.varMap));
  }

  static find(thiz) {
    return thiz.hitSide.map(dot => dot.flatten(thiz.varMap));
  }

  static translate(thiz) {
    return thiz.replaceSide.map(dot => dot.flatten(thiz.varMap));
  }
}

let variableCounter = 0;

export class HashDots {
  static parse(input) {
    input = input.trim();
    if (input.length === 0)
      return [];
    if (!(input.startsWith("#") || input.startsWith("/") || input.startsWith("!") || input.startsWith(";")))
      throw new SyntaxError(`HashDot sequence must start with #,!,/ or ;.\nInput:  ${input}\nError:  ↑`);

    const varCounter = variableCounter++;
    const hashOrDot = /[#/!]+([\w]+)|\.([\w]+)|\."((\\.|[^"])*)"|\.'((\\.|[^'])*)'|::?[\w]+|=|;|\s+|(.+)/g;
    const rules = [];
    let rule = {left: []};
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
      if (word === "=") {
        rule.right = [];
        dots = rule.right;
        dot = undefined;
        continue;
      }
      if (word === ";") {
        if (rule.left.length !== 0) {
          rules.push(rule);
          rule = {left: []};
          dots = rule.left;
        }
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
    if (rule.left.length !== 0)
      rules.push(rule);
    return rules;
  }

  static subsetMatch(a, b, c) {
    for (let i = 0; i < a.length; i++) {
      if (a.length - i < b.length)
        return null;
      for (let j = 0; j < b.length; j++) {
        let varMap = HashDots._matchImpl(a, b, i, j);
        if (varMap)
          return new MatchResult(a, b, c, i, b.length, varMap);
      }
    }
    return null;
  }

  static supersetMatch(a, b, c) {
    for (let i = 0; i < b.length; i++) {
      if (b.length - i < a.length)
        return null;
      for (let j = 0; j < a.length; j++) {
        let varMap = HashDots._matchImpl(b, a, i, j);
        if (varMap)
          return new MatchResult(a, b, c, i, a.length, varMap);
      }
    }
    return null;
  }

  static exactMatch(a, b, c) {
    if (a.length !== b.length)
      return null;
    let varMap = HashDots._matchImpl(a, b, 0, 0);
    if (varMap)
      return new MatchResult(a, b, c, 0, a.length, varMap);
    return null;
  }

  static _matchImpl(a, b, i, j) {
    let varMap = {};
    for (let k = 0; k < b.length; k++) {
      if (!a[i + k].match(b[j + k], varMap))
        return null;
    }
    return varMap;
  }
}

export class HashDotMap {

  static make(routeMap) {
    return new HashDotMap(routeMap);
  }

  constructor(routeMap) {
    this._rules = HashDots.parse(routeMap);
  }

  query(input) {
    if (typeof input === "string" || input instanceof String)
      input = HashDots.parse(input)[0].left;
    return new HashDotQuery(input, this._rules);
  }
}

class HashDotQuery {
  constructor(input, rules) {
    this.input = input;
    this.original = input;
    this._recursive = false;
    this.interpreter = MatchResult.translate;
    this.matchFunction = HashDots.exactMatch;
    this.i = 0;
    this.rules = rules;
    this._reverse = false;
  }

  find() {                                //todo rename to show
    this.interpreter = MatchResult.find;
    return this;
  }

  translate() {
    this.interpreter = MatchResult.translate;
    return this;
  }

  transform() {                           //todo rename to convert
    this.interpreter = MatchResult.transform;
    return this;
  }

  //todo add the possibility of retrieving the whole rule?

  ruleIsSubsetOfQuery() {
    this.matchFunction = HashDots.subsetMatch;
    return this;
  }

  queryIsSubsetOfRule() {
    this.matchFunction = HashDots.supersetMatch;
    return this;
  }

  queryIsExactRule() {
    this.matchFunction = HashDots.exactMatch;
    return this;
  }

  [Symbol.iterator]() {
    return this;
  }

  recursive() {
    this._recursive = true;
    return this;
  }

  reverse() {
    this._reverse = !this._reverse;
    return this;
  }

  next() {
    while (this.i < this.rules.length) {
      let rule = this.rules[this.i++];
      let value = this._reverse ? this.matchFunction(this.input, rule.right, rule.left) : this.matchFunction(this.input, rule.left, rule.right);
      if (!value)
        continue;
      if (this.interpreter)
        value = this.interpreter(value);
      if (this._recursive) {
        this.i = 0;
        this.input = value;
      }
      return {done: false, value: value};
    }
    return {done: true};
  }

  first() {
    this.i = 0;
    return this.next().value;
  }

  //todo these for loops should have finite borders.
  //todo a check could be added to ensure that no next will be added to the list if it is
  tillTheEnd() {
    return [this.original].concat(Array.from(this.recursive()));
  }
}
