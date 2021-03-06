//should we add "/gi" ?
/*
needs to be split up into a series of value tokens and comma tokens.
Then, this big list will be split up into a set of smaller lists on the comma tokens.
So, we can get a flat list,
or a list of comma separated lists.
This is simplest to always return as a list of comma separated lists, kinda.
Then, to get the value of each token, we have to access it as either a primitive word, a number value, or a function.
(The #color is a shortcut for an rgb function, but this is simple and not very relevant.)
The real problem is parsing the CSS function.
The function consists of a function name, then a "(" and then a list of comma separated function expressions, and then ")".
what can be a function name?
what can be a function expression?
the function expression can be either a:
1. quoted string
2. another function expression
3. primitive word, or number value
4. calc expression (boolean expression):
   10px + 20%vh
   width >= 200px

*/

/**
 CSS Value token list:
 ********************
 0. <space>                                          \s+
 1. <word>                                           [-]*[a-zA-Z_][a-zA-Z_0-9-]*         "-", "--", "---", etc. and "---3d" are not legal css variable names; "--_" and "---d3" are legal
 2. <number>                                         [+-]?(\d+.\d+|.\d+|\d+)(e[+-]?\d+)?
 4. <operator>                                       >=|<=|==|[#\(\),<>/*+%-]
 "==", "<=", ">=", "#", "+", "-", "*", "/", ">", "<", "%", "(", ",", ")"
 5. <singlequote>                                    '((\\\\|\\'|[^'\n])*)'
 6. <doublequote>                                    "((\\\\|\\"|[^"\n])*)"
 7. <hashcolor>                                      #[0-9a-fA-F]+
 8. any other finding would be an error              .+

 * @type {RegExp}
 */
const tokenizer = /(\s+)|([+-]?\d*\.?\d+(e[+-]?\d+)?)|([-]*[a-zA-Z_][a-zA-Z_0-9-]*)|#([0-9a-fA-F]+)|(>=|<=|==|[(),/<>+*%-])|'((\\\\|\\'|[^'\n])*)'|"((\\\\|\\"|[^"\n])*)"|(.+)/g;

export class CssValueTokenizer {
  constructor(str) {
    tokenizer.lastIndex = 0;
    this._input = str.trim();
    this._next = undefined;
    this._nextNext = undefined;
    this._active = true;
  }

  hasNext() {
    return this._active;
  }

  _nextToken() {
    if (!this._active)
      return null;
    const token = tokenizer.exec(this._input);
    if (token === null) {
      this._active = false;
      return null;
    }
    if (token[11])
      throwSyntaxError("Illegal token: ", token);
    return token;
  }

  next() {
    if (this._next === undefined)
      return this._nextToken();
    let n = this._next;
    this._next = this._nextNext;
    this._nextNext = undefined;
    return n;
  }

  lookAhead() {
    if (this._next === undefined)
      this._next = this._nextToken();
    return this._next;
  }

  lookAheadAhead() {
    if (this._nextNext === undefined) {
      this.lookAhead();
      this._nextNext = this._nextToken()
    }
    return this._nextNext;
  }
}
function throwSyntaxError(msg, token) {
  throw new SyntaxError(msg + "\n  " + token.input + "\n  " + new Array(token.index + 1).join(" ") + "^");
}

/**
 *   CSS Value BNF:
 *************
 CssValue ::= ValueList ("," ValueList)*
 ValueList ::= <space>? Value (<space> Value)* <space>?            //if the next thing is a ",", return, "error"=> error, the rest is a value
 Value ::= Function | Primitive
 Function ::= <word> "(" <space>? ExpressionList <space>? ")"
 ExpressionList ::= Expression (<space>* "," <space>* Expression)*            //if the next thing is a ",", return, "error"=> error, the rest is a value
 Expression ::= Operation | Value
 Operation ::= Value <space> <operator> <space> Expression
 Primitive ::= <word> | NumberUnit | <hashColor> | <quote>
 NumberUnit ::= <number> ("%" | <word>)?
 */
export function parseCssValue(str) {
  const tokens = new CssValueTokenizer(str);
  let result = [];
  while (tokens.hasNext()) {
    result.push(parseSpaceSeparatedValueList(tokens));
    if (!tokens.hasNext())
      return result;
    let next = tokens.next();
    if (next && next[0] !== ",")
      throw new SyntaxError("not a list of values nor a comma, but: " + next[0]);
  }
  return result;
}

function parseSpaceSeparatedValueList(tokens) {
  let result = [];
  for (let next = tokens.lookAhead(); next; next = tokens.lookAhead()) {
    if (next && next[1] /*isSpace*/) {
      tokens.next();
      continue;
    }
    if (next[0] === ",")
      return result;
    result.push(parseValue(tokens));
  }
  return result;
}

function parseValue(tokens) {
  const lookAheadAhead = tokens.lookAheadAhead();
  if (lookAheadAhead && lookAheadAhead[0] === "(") {
    const name = tokens.next()[0];
    tokens.next();  //skip the "("
    const children = parseCssExpressionList(tokens);
    return {type: "function", name, children};
  }
  return parsePrimitive(tokens);
}

function parseCssExpressionList(tokens) {
  let result = [];
  for (let next = tokens.lookAhead(); next; next = tokens.lookAhead()) {
    if (next[1]) //isSpace
      tokens.next();
    else {
      result.push(parseExpression(tokens));
      next = tokens.next();
      if (next[1]) //isSpace
        next = tokens.next();
      if (next[0] === ",")
        continue;
      if (next[0] === ")")
        return result;
      throwSyntaxError("Illegal CSS value expression list:", next);
    }
  }
}

function parseExpression(tokens) {
  const left = parseValue(tokens);
  const operator = getOperator(tokens);
  if (operator) {
    return {
      type: "operation",
      left,
      operator,
      right: parseExpression(tokens)
    };
  }
  return left;
}

function getOperator(tokens) {
  const space = tokens.lookAhead();
  if (!space || !space[1]) //next is not space
    return undefined;
  tokens.next(); //skip space
  const op = tokens.lookAhead();
  if (!op || !op[6]) //nextNext is not an operator
    return undefined;
  const operator = tokens.next()[0];
  const space2 = tokens.next();
  if (!space2[1])           //there is no space after the operator
    throwSyntaxError("Css value operator must be surrounded by space:", space2);
  return operator;
}

function parsePrimitive(tokens) {
  const next = tokens.next();

  if (next[5]) {
    const l =next[5].length;
    if (l === 3 || l === 4 || l === 6 || l === 8)   //todo loosen the parser here a bit?
      return {type: "#", value: next[5]};
   throwSyntaxError("Illegal #color: ", next);
  }
  if (next[11])
    throwSyntaxError("Illegal Primitive: ", next);
  if (next[4] /*isWord*/)
    return {type: "word", value: next[0]};
  if (next[7] /*isSingleQuote*/)
    return {type: "quote", value: next[0], text: next[7]};
  if (next[9] /*isDoubleQuote*/)
    return {type: "quote", value: next[0], text: next[9]};
  if (next[2] /*isNumber*/) {
    let lookAhead = tokens.lookAhead();
    if (lookAhead && (lookAhead[4] /*isWord*/ || lookAhead[0] === "%"))
      return {type: "number", unit: tokens.next()[0], value: next[0]};
    return {type: "number", value: next[0]};
  }
  throwSyntaxError("Illegal CSS primitive value: ", next);
}

/**
 *
 * interpret CSS value functions
 *
 **/

export function interpretCssValue(value) {
  function hsl(name, args) {
    return convertHslToRgb(args);
  }

  function colorcalc(name, args) {
    //identify the operator in the args, and then interpret it
  }

  function calc(name, args) {
    let printOfTheOperatorArgs = "do + 12px - of + all + args";
    return "calc(" +printOfTheOperatorArgs+ ")";
  }

  function hash(name, str) {
    if (str.length === 3)
      return [parseInt(str[0], 16) * 16, parseInt(str[1], 16) * 16, parseInt(str[2], 16) * 16];
    if (str.length === 6)
      return [parseInt(str[0] + str[1], 16), parseInt(str[2] + str[3], 16), parseInt(str[4] + str[5], 16)];

    let printOfTheOperatorArgs = "do + 12px - of + all + args";
    return "calc(" +printOfTheOperatorArgs+ ")";
  }

  function __defaultInterpretation(name, args) {
    return name + "(" + args.join(",") + ")";
  }

  if (value.type === "#"){

  }
  if (value.type === "function") {
    let args = value.children.map(child => interpretCssValue(child));
    let name = value.name === "#" ? "hash" : value.name;
    let fn = this[value.name];
    if (!fn instanceof Function)
      fn = this[__defaultInterpretation];
    return fn(name, args);
  }
  if (value.type === "operator")
    return value;
  if (value.type === "number")
    return value.value + (value.unit || "");
  if (value.type === "word")
    return getColorWordValue(value.value) || value.value;
  return value.value;
}


export function getRgbValue(_obj) {
  if (_obj.type === "function" && _obj.unit === "rgb")
    return _obj.children.map(number => parseInt(number.value));
  if (_obj.type === "#") {
    const str = _obj.value;
    if (str.length === 3)
      return [parseInt(str[0], 16) * 16, parseInt(str[1], 16) * 16, parseInt(str[2], 16) * 16];
    if (str.length === 6)
      return [parseInt(str[0] + str[1], 16), parseInt(str[2] + str[3], 16), parseInt(str[4] + str[5], 16)];
  }
  if (_obj.type === "function" && _obj.unit === "hsl")
    return convertHslToRgb(_obj);
  if (_obj.type === "function" && _obj.unit === "colorcalc") {
    return interpretColorCalc(_obj);
  }
  return undefined;
}