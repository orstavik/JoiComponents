function wordType(c) {
  if (c === "'" || c === '"') return "'";
  if (/[\w]/.test(c)) return "w";
  return "u";
}

function tokenizeAndParse(hashString) {
  const toks = /("|')((?:\\\1|(?:(?!\1).))*)\1|\.|:|\?|#|[\w]+/g;
  const hashdots = [];
  let hashdot;

  while (true) {
    let t1 = toks.exec(hashString);
    if (t1 === null)
      break;
    let t2 = toks.exec(hashString);
    if (t2 === null)
      throw new SyntaxError("HashDots cannot end with: -->" + t1[0] + "<--.\nFull HashDots string: -->" + hashString + "<--");
    let one = t1[0], two = t2[0];
    let twoType = wordType(two[0]);
    if (one === "#") {
      if (twoType === "w") {
        hashdot = {keyword: two, arguments: [], argumentTypes: [], argumentString: ""};
        hashdots.push(hashdot);
        continue;
      } else {
        throw new SyntaxError("A HashDot must start with #Keyword (#[\\w]+): -->" + one + two + "<--\nFull HashDots string: -->" + hashString + "<--");
      }
    }
    if (!hashdot)
      throw new SyntaxError("A HashDot must start with #Keyword (#[\\w]+): -->" + one + two + "<--\nFull HashDots string: -->" + hashString + "<--");

    if (one === "." || one === ":" || one === "?") {
      if (twoType === "w" || twoType === "'") {
        hashdot.arguments.push(two);
        hashdot.argumentTypes.push(one);
        hashdot.argumentString += one + two;
        continue;
      } else {
        throw new SyntaxError(
          "A HashDot argument value must be an AlpaNumeric or a \"quoted\" 'string'."
        );
      }
    }
    throw new SyntaxError("A HashDot sequence begins with either '#', '.' or ':', not: -->" + one + "<--");
  }
  return hashdots;
}

export function parseHashDots(hashString) {

  const tree = tokenizeAndParse(hashString);
  const map = {};
  const params = {};
  for (let hashdot of tree) {
    for (let i = 0; i < hashdot.arguments.length; i++) {
      let arg = hashdot.arguments[i];
      let argType = hashdot.argumentTypes[i];
      if (argType === "?" && hashdot.arguments.length > 1)
        throw new SyntaxError("A HashDot can only contain a single universal parameter '?'.\nNot a sequence of either arguments '.something' and/or parameters ':A', not both.");
      if (argType === "?" ||argType === ":"){
        const key = argType + arg;
        params[key] || (params[key] = {type: argType, name: arg, keyword: hashdot.keyword, position: i});
      }
    }
    hashdot.signature = hashdot.keyword + "/" + hashdot.arguments.length;   //todo maybe remove this
    map[hashdot.keyword] = hashdot.arguments;
  }
  return {map, tree, params};
}

// export class HashDotsRouteMap {
//   constructor(routeMap){
//     this.routeMap = routeMap.values().map(entry =>({
//       left: parseHashDots(entry[0]),
//       right: parseHashDots(entry[1])
//     }));
//     this.leftToRight = makeLeftToRight(routeMap);
//     // this.rightToLeft = makeLeftToRight(routeMap.reverse());
//   }
//
//   right(hashdots){
//     const given = parseHashDots(hashdots);
//     this.resolveLeftToRight(given);
//   }
//
//   resolveLeftToRight(resolved){
//     for (let i = 0; i < resolved.tree.length; i++) {
//       const hashdot = resolved.tree[i];
//       const signature = hashdot.signature;
//
//       rule: for (let j = 0; j < this.routeMap.length; j++) {
//         let rule = this.routeMap[j];
//         let left = rule.left.tree[0];
//         if (left.signature === signature || left.universalArguments && left.keyword === hashdot.keyword){
//           //i and j is good for one rule
//           for (let k = i+1, l = 1; l < rule.left.tree.length; k++, l++) {
//             if (k >= resolved.tree.length)
//               break rule;
//             const nextResolved = resolved.tree[k];
//             const nextLeft = rule.left.tree[l];
//             if (!(nextLeft.signature === nextResolved.signature || nextLeft.universalArguments && nextLeft.keyword === nextResolved.keyword)){
//               break rule;
//             }
//           }
//           //rules match
//           let right = rule.right;
//           //todo this is the job of the makeLeftToRight(routeMap)
//           //loop through all the right arguments. Find the parameters. Find the equivalent parameter name in the left rule.
//           //And then find the position of that parameter in the left rule. And then get the arguments for the parameters from the resolved.map.
//         }
//       }
//     }
//   }
//   makeLeftToRight(routeMap){
//     return routeMap.map(rule => {
//       const left = rule.left;
//       const right = rule.right;
//
//     });
//
//   }
// }
//
export class HashDotsRouter {
  constructor() {
    this.inputHash = undefined;
    // this.leftHash = undefined;
    // this.rightHash = undefined;
    window.addEventListener("hashchange", this._onHashchange);
    //dispatch an initial routechange event at the first raf after startup
    requestAnimationFrame(() => this._onHashchange());
  }

  _onHashchange() {
    let currentHash = window.location.hash;
    if (this.inputHash === currentHash) //will become this.leftHash === currentHash
      return;
    let hashdots = parseHashDots(currentHash);
    window.dispatchEvent(new CustomEvent("routechange", {detail: hashdots}));
  }
}