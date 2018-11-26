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

  static exactMatch(left, right, varMap) {
    if (left.length !== right.length)
      return false;
    for (let i = 0; i < left.length; i++) {
      if (!left[i].match(right[i], varMap))
        return false;
    }
    return true;
  }
}

//todo Should queries get their own symbols like:
//     "#book ??" would ask for the rightmost resolution of #book, ie. HashDotMap.query("#book ??") instead of HashDotMap.right("#book")
//     "?? #book" would ask for the leftmost resolution of #book
//     "#book ?" would ask for a single right resolution of #book
//     "? #book" would ask for a single left resolution of #book

export class HashDotMap {
  constructor(routeMap) {
    this.rules = HashDots.parse(routeMap);
    this.reverseRules = this.rules.map(rule => ({left: rule.right, right: rule.left}));
  }

  right(hashdots) {
    (typeof hashdots === "string" || hashdots instanceof String) && (hashdots = HashDots.parse(hashdots)[0].left);
    return HashDotMap.resolve(hashdots, this.rules);
  }

  left(hashdots) {
    (typeof hashdots === "string" || hashdots instanceof String) && (hashdots = HashDots.parse(hashdots)[0].left);
    return HashDotMap.resolve(hashdots, this.reverseRules);
  }

  interpret(newLocation) {
    const middle = HashDots.parse(newLocation)[0].left;
    let left = this.left(middle);
    let right = this.right(middle);
    let rootLink = left.map(dot => dot.toString()).join("");
    return {rootLink, left, middle, right};
  };

  static resolve(main, rules, i = 0) {
    for (/*let i = 0*/; i < rules.length; i++) {
      let next = HashDots.matchAndReplace(main, rules[i]);
      if (next) {
        i = -1;
        main = next;
      }
    }
    return main;
  }

  rightResolver(hashdots){
    (typeof hashdots === "string" || hashdots instanceof String) && (hashdots = HashDots.parse(hashdots)[0].left);
    return HashDotMap.resolver(hashdots, this.rules);
  }

  static resolver(main, rules) {
    const hits = [];
    let i = 0;
    return {
      next() {
        if (main === null)
          return null;
        while (i < rules.length) {
          let varMap = {};
          const ruleLeftSide = rules[i++].left;
          if (HashDots.exactMatch(main, ruleLeftSide, varMap)) {
            let res = main.map(dot => dot.flatten(varMap));
            hits.push(res);
            return res;
          }
        }
        if (!hits.length)
          return main = null;
        main = hits.shift();
        return this.next();
      }
    };
  }

  resolveRight(hashdots) {
    (typeof hashdots === "string" || hashdots instanceof String) && (hashdots = HashDots.parse(hashdots)[0].left);
    for (let rule of this.rules) {
      let next = HashDots.matchAndReplace(hashdots, rule);
      if (next)
        return next;
    }
    return undefined;
  }
}