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
1. <word>                                           [a-z]+
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

/\s+|[a-z]+|[+-]?\d*\.?\d+(e[+-]?\d+)?|>=|<=|==|[#(),/<>+*%-]|'((\\\\|\\'|[^'\n])*)'|"((\\\\|\\"|[^"\n])*)"|(.*)/g

2. CSS Value BNF:
*************
CssValue := ValueList ["," ValueList]*
ValueList := <space>? Value [<space> Value]* <space>?            //if the next thing is a ",", return, "error"=> error, the rest is a value
Value := Function | Primitive
Function := <word> "(" ExpressionList ")"
ExpressionList := <space>? Expression [<space>* "," <space>* Expression]* <space>?            //if the next thing is a ",", return, "error"=> error, the rest is a value
Expression := Value [Operation]*
Operation := <space> <operator> <space> Expression
Primitive := <word> | Number | HashColor
HashColor := "#" <number> (of 3 or 6 integers)
Number := <number> ["%" | <word>]?

2.b JS Parser:
*********


3 getPropertyValueObject:
[
  [value, value, value],
  [value, value, value],
  ...
]

CSSValue
   .getType() returns "color", "number", "word"
   .getValue() returns the interpreted result of the value as a String, that would compute the "if(..)" expression
   .getNumberValue()
   .getNumberType()
   .getColorValue()
*
**/

const tokenizer = /(\s+)|([a-z]+)|([+-]?\d*\.?\d+(e[+-]?\d+)?)|>=|<=|==|[#(),/<>+*%-]|'((\\\\|\\'|[^'\n])*)'|"((\\\\|\\"|[^"\n])*)"|(.+)/g;
export function tokenizeCssValues(str){
  return tokenizer.exec(str);
}

function parseCssValueImpl(tokens) {
  let result = [];
  result.push(parseValueList(tokens));
  while (tokens.next === ",")
    result.push(parseValueList(tokens));
  return result;
}

function parseValueList(tokens) {
  let result = [];
  while (tokens.hasNext){
    if (tokens.next === "space")
      continue;
    if (tokens.next === ",")
      return result;
    if (tokens.next === "error")
      throw new Error("syntax error, illegal token");
    result.push(parseValue(tokens));
  }
}

function parseValue(tokens){
  if (tokens.next.next === "("){
    return expression = {
      type: tokens.next,
      children: parseCssExpressionList(tokens)
    }
  }
  return parsePrimitive(tokens);
}

function parseCssExpressionList(tokens) {
  let result = [];
  let expressionState = true;
  while (tokens.hasNext){
    if (tokens.next === "space")
      continue;
    if (tokens.next === ","){
      if (expressionState)
        throw new Error("syntax error, empty expression argument. two ,, side by side: 'clamp(10px, , 2em)', or expression starting with comma: 'clamp(,10px)'. ");
      else
        expressionState = true;
    }
    if (tokens.next === "error")
      throw new Error("syntax error, illegal token");
    if (tokens.next === ")")
      return result;
    result.push(parseExpression(tokens));
    expressionState = false;
  }
  throw Error("CSS function did not end with a ')'.");
}

function parseExpression(tokens) {

}

export function parseCssValue(str){
  for(var xArray; xArray = tokenizer.exec(str);){
    debugger;
    console.log(xArray);
  }
}