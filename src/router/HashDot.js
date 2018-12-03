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

//todo Should queries get their own symbols like:
//     "#book ??" would ask for the rightmost resolution of #book, ie. HashDotMap.query("#book ??") instead of HashDotMap.transformAll("#book")
//     "?? #book" would ask for the leftmost resolution of #book
//     "#book ?" would ask for a single right resolution of #book
//     "? #book" would ask for a single left resolution of #book

/*

The most important choice to make when making a programming language:
internalize the query?

When making a programming language, the power of simply defining operators and native expression and base logic of the language
can quickly become intoxicating. For you as the developer of the language, it might be easy to remember this logic, as
you probably feel quite strong positive emotions towards them. But, for others, the multitude and variety of operators,
native expressions and other grammaticalized logic quickly becomes overloads both their interest and learning capabilities,
thus making them dislike the structure.

You also have two dimensions, the data structure and the functional structure. The data structure defines the space of
your programming language. The functional structure defines the causal logic in the temporal (and/or spatial) dimension
of your programming language.

When you make a programming language, you might desire to define custom grammatical structures for both the data structure,
and the causal structure. But, you should be aware to limit this desire. Try to make grammatical structures only for the
data structure OR the causal structure FIRST, and although you might specify rule-based behavior of all structures within the
domain, try to let as much of one dimension be specified in the program language where the language is used in the beginning,
to lessen the learning burden for the languages users.

In HashDots we therefore let the query/functions run against the HashDot data structures and rules be specified via
JS functions, and NOT grammaticalized as custom HashDots symbols such as ?? and ~= etc.

## HashDots iterator

takes a HashDot query as an input, and then walks the ruleset based on that query.
Each step of the walk is made up of two or more actions against the rules.
The first action is the specification of how the query can/must be matched against the rule.
This can be either an exact match (allowing variables to be bound), subset match, and superset match.

The second action is how the input and rule are combined to create an output.
When a query and a rule match, the HashDot iterator can either return:
1. the left side of the rule (.find())
2. the right side of the rule (.translate())
3. merge the right side of the rule into the input (.transform())
4. the raw match result

The HashDots iterator can also work both iteratively (default) and recursively.
When the iterator is in iterative mode, it will find matches checking against the next available rule.
In iterative mode, the HashDotsIterator is finite, it cannot create infinite loops.

When the iterator is in recursive mode, it will continue its work based on the produced result from the iterator,
starting from scratch on the ruleset.
In recursive mode, the HashDotsIterator is infinite. It *can* create infinite loops.

The HashDotsIterator can be made to go from leftToRight() and rightToLeft() (called .reverse()) for each rule,
and from topToBottom() and bottomToTop() in the ruleset (is most likely thought of as .reverse() too, todo).

 *
 */

const rules = Symbol("rules");
const reverse = Symbol("reverse");

export class HashDotMap {

  static make(routeMap) {
    const parsed = HashDots.parse(routeMap);
    const res = new HashDotMap(parsed);
    res[reverse] = new HashDotMap(parsed.map(rule => ({left: rule.right, right: rule.left})));
    res[reverse][reverse] = res;
    return res;
  }

  constructor(routes) {
    this[rules] = routes;
    this[reverse] = null;
  }

  reverse() {
    return this[reverse];
  }

  //rules.reverse().query("input").translate()        //rules.reverse().translate().equals("input")
  //rules.reverse().ruleIsSubsetOfQuery("input").transform()    //rules.reverse().transform().subset("input")
  //rules.reverse().queryIsSubsetOfRule("input").find()         //rules.reverse().find().superset("input")

  //reverse() -> make the rules go in opposite direction.

  //find, finds the rules that fulfill the matching criteria
  //translate, finds the opposite side of the rule that match the criteria
  //transform, replaces the opposite side of the rule with the matching side of the rule in the criteria

  //matching methods:
  // equals: the input equals the rule a-side,
  // subset: the input is a superset of the rule a-side
  // superset: the input is a subset of the rule a-side

  //.first()
  //.tillTheEnd()
  //Array.from()

  query(input) {
    return HashDotMap.resolver(HashDotMap.parseQuery(input), this[rules]);
  }

  ruleIsSubsetOfQuery(input) {
    return this.query(input).subset();
  }

  queryIsSubsetOfRule(input) {
    return this.query(input).superset();
  }

  static parseQuery(hashdots) {
    if (typeof hashdots === "string" || hashdots instanceof String)
      return HashDots.parse(hashdots)[0].left;
    return hashdots;
  }

  //todo add the possibility of retrieving the whole rule?
  static resolver(input, rules, interpreter) {
    return {
      input: input,
      _recursive: false,
      interpreter: interpreter,
      matchFunction: HashDots.exactMatch,
      i: 0,
      find: function () {                                //todo rename to show
        this.interpreter = MatchResult.find;
        return this;
      },
      translate: function () {
        this.interpreter = MatchResult.translate;
        return this;
      },
      transform: function () {                           //todo rename to convert
        this.interpreter = MatchResult.transform;
        return this;
      },
      subset: function(){
        this.matchFunction = HashDots.subsetMatch;
        return this;
      },
      superset: function(){
        this.matchFunction = HashDots.supersetMatch;
        return this;
      },
      exact: function(){
        this.matchFunction = HashDots.exactMatch;
        return this;
      },
      [Symbol.iterator]: function () {
        return this;
      },
      recursive: function(){
        this._recursive = true;
        return this;
      },
      next() {
        while (this.i < rules.length) {
          let rule = rules[this.i++];
          let value = this.matchFunction(this.input, rule.left, rule.right);
          if (!value)
            continue;
          if (this.interpreter)
            value = this.interpreter(value);
          if (this._recursive){
            this.i = 0;
            this.input = value;
          }
          return {done: false, value: value};
        }
        return {done: true};
      },
      first: function () {
        this.i = 0;
        return this.next().value;
      },
      //todo these for loops should have finite borders.
      //todo a check could be added to ensure that no next will be added to the list if it is
      tillTheEnd: function () {
        return [this.input].concat(Array.from(this.recursive()));
      }
    };
  }
}