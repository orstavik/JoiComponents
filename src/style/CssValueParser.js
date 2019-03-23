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

1. CSS Value token list:
********************
0. <space>                                          \s+
1. <word>                                           [\w][\w\d]*             -3e3
2. <number>                                         [+-]?(\d+.\d+|.\d+|\d+)(e[+-]?\d+)?
4. <operator>                                       >=|<=|==|[#\(\),<>/*+%-]
"==", "<=", ">=", "#", "+", "-", "*", "/", ">", "<", "%", "(", ",", ")"
5. <singlequote>                                    '((\\\\|\\'|[^'\n])*)'
6. <doublequote>                                    "((\\\\|\\"|[^"\n])*)"
7. any other finding would be an error              .+

1.b Regex Tokenizer:
***************
  \s+ |
  [a-z]+ |
  [+-]?\d*\.?\d+(e[+-]?\d+)? |
  >=|<=|==|[#\(\),<>/*+%-] |
  '((\\\\|\\'|[^'\n])*)'|
  "((\\\\|\\"|[^"\n])*)"|
  .+
/\s+|[a-z]+|[+-]?\d*\.?\d+(e[+-]?\d+)?|>=|<=|==|[#(),/<>+*%-]|'((\\\\|\\'|[^'\n])*)'|"((\\\\|\\"|[^"\n])*)"|(.+)/g

2.b JS Parser:
*********

  CSS Value BNF:
  *************
  CssValue ::= ValueList ("," ValueList)*
  ValueList ::= <space>? Value (<space> Value)* <space>?            //if the next thing is a ",", return, "error"=> error, the rest is a value
  Value ::= Function | Primitive
  Function ::= <word> "(" <space>? ExpressionList <space>? ")"
  ExpressionList ::= Expression (<space>* "," <space>* Expression)*            //if the next thing is a ",", return, "error"=> error, the rest is a value
  Expression ::= Value Operation?
  Operation ::= <space> <operator> <space> Expression
  Primitive ::= <word> | Number | HashColor
  HashColor ::= "#" <number>{3,4,6,8}
  Number ::= <number> ("%" | <word>)?

3 getPropertyValueObject:
************************
[
  [value, value, value],
  [value, value, value],
  ...
]
CSSValue
   .getType() returns "number", "number with unit", "word", "color", "colorword", what about special "inherit"
   .getValue() returns the interpreted result of the value as a String, that would compute the "if(..)" expression
   .getNumberValue() parseInt() can we expect our users to know and handle that? yes.
   .getNumberUnit() === "type", can we expect our users to know and handle that? yes.
   .canBeAColor()
   .getColorValue()
   .getRgbValue()
   .getListOfPossibleProperties() "solid" will then return border, border-type,
   .isUniversalPropertyValue() "inherit, initial" etc.
*
**/

const tokenizer = /(\s+)|([+-]?\d*\.?\d+(e[+-]?\d+)?)|([a-zA-Z_-][a-zA-Z_0-9-]*)|(#[0-9a-fA-F]+)|(>=|<=|==|[(),/<>+*%-])|'((\\\\|\\'|[^'\n])*)'|"((\\\\|\\"|[^"\n])*)"|(.+)/g;

export class CssValueTokenizer {
  constructor(str) {
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
      throw new SyntaxError("Illegal token: " + token[0]);
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


class CssValue {
  constructor(obj) {
    this._obj = obj;
  }

  //colorcalc(red - blue)
  // interpret(){
  //   if(this._obj.type === "function" && this._obj.unit === "colorcalc"){
  //     //here we would take the operation, if the operation is "-"
  //     if (this.children[1].getType() === "operation" && this.children[1].getValue() === "-"){
  //       let left = this.children[0];
  //       let right = this.children[1].children[0];
  //       let hslLeft = getHslValue(left);
  //       let hslRight = getHslValue(right);
  //       let halfway = mergeHslValues(hslLeft, hslRight);
  //       return hslToRGB(halfway);
  //     }
  //   }
  // }
  //
  getRgbValue() {
    if (this._obj.type === "function" && this._obj.unit === "rgb")
      return this._obj.children.map(number => parseInt(number.value));
    if (this._obj.type === "#") {
      const str = this._obj.value;
      if (str.length === 3)
        return [parseInt(str[0], 16) * 16, parseInt(str[1], 16) * 16, parseInt(str[2], 16) * 16];
      if (str.length === 6)
        return [parseInt(str[0] + str[1], 16), parseInt(str[2] + str[3], 16), parseInt(str[4] + str[5], 16)];
    }
    return undefined;
  }

  getValue() {
    if (this._obj.type === "function") {
      return {name: this._obj.name, args: this._obj.children.map(child => child.getValue())}
    }
    if (this._obj.type === "number")
      return this._obj.unit ? this._obj.value + this._obj.unit : this._obj.value;
    return this._obj.value;
  }

  getType() {
    return this._obj.type;
  }
}

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
    if (next[1] /*isSpace*/) {
      tokens.next();
      continue;
    }
    if (next[0] === ",")            //todo check if ,, is a syntax error for ValueList?
      return result;

    if (next === null)            //todo end of the sequence
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
      throw SyntaxError("Illegal CSS expression list.");
    }
  }
}

// calc(21px +%12px)

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
    throw new SyntaxError("Css value operator '" + operator + "' must be surrounded by space: " + space2[0]);
  return operator;
}

function parsePrimitive(tokens) {
  const next = tokens.next();

  /*check is a value starts with a hash*/
  /*This check has been moved bottom up*/
  //-------------------------------------------------------------------------------------------------
  if (next[0].startsWith("#")) {                     //todo Max: it make a sense to check hash symbol in the beginning to avoid errors (especially for hash colors)
    const nextNext = tokens.next();
    /*Check if it has a valid character length (include #symbol) */
    if (next[0].length === 4 || next[0].length === 5 || next[0].length === 7 || next[0].length === 9)  //todo Max: fixed # colors possible lengths
    /*Remove first character from the string in the value property to remove #*/
      return {color: "#", value: next[0].substr(1)};
    throw new SyntaxError("illegal #color: " + next[0] + nextNext[0]);
  }
  //-------------------------------------------------------------------------------------------------
  if (next[9])                                  //todo how to treat errors, should we allow it to exist?
    return {type: "error", value: next[8]};
  if (next[4] /*isWord*/)
    return {type: "word", value: next[0]};
  if (next[7] /*isSingleQuote*/)
    return {type: "quote", value: next[0], text: next[7]};
  if (next[9] /*isDoubleQuote*/)
    return {type: "quote", value: next[0], text: next[9]};
  if (next[2] /*isNumber*/) {
    let lookAhead = tokens.lookAhead();
    if (lookAhead[4] /*isWord*/ || lookAhead[0] === "%")
      return {type: "number", unit: tokens.next()[0], value: next[0]};
    return {type: "number", value: next[0]};
  }

  throw new SyntaxError("Illegal CSS primitive value: " + next[0]);
}