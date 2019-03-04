1. can't mix custom CSS shorthand properties and (regular, end-point) CSS properties. 
   Custom CSS shorthand properties are treated as regular, end-point properties. 

2. style is returned in an object with custom specialized getter methods:

```javascript
var styleValue = {
  value: "day #123456",
  values: ["day", "#123456"],
  _colors: undefined,
  _numbers: undefined,
  _others: undefined,
  _othersSmall: undefined,
  _isColor: function(value){
    return /white/.matches(value);
  },
  _isNumber: function(value){
    return /\n+/.matches(value);
  },
  _process: function(){
    this._colors = [];
    this._numbers = [];
    this._others = [];
    for (let value of values){
      if (this._isColor(value))
        this._colors.push(value);
      else if (this._isNumber(value))
        this._numbers.push(value);
      else 
        this._others.push(value);
    }
  }, 
  getColor: function(nr, fourTwoZero_Three_one_zero) {
    this._colors || this._process();
    while (fourTwoZero_Three_one_zero && this._colors.length < nr)
      nr = (nr === 4) ? 2 : (nr === 3) ? 1 : 0;
    return this._colors[nr];
  }, 
  getNumber: function(nr, fourTwoZero_Three_one_zero){
    this._numbers || this._process();
    while (fourTwoZero_Three_one_zero && this._numbers.length < nr)
      nr = (nr === 4) ? 2 : (nr === 3) ? 1 : 0;
    return this._numbers[nr];    
  },
  getOther: function(nr){
    return this._others[nr];
  },
  hasValue: function(name, casesensitive){
    if (!casesensitive)
      return this._others.indexOf(name) >= 0;
    this._othersSmall || (this._othersSmall = this._others.map(function(str){return str.toLowerCase();}));
    return this._othersSmall.indexOf(name.toLowerCase()) >= 0;
  },
  //arrayOfNames = ["inherit", "none", "unset"];
  getEnumerationValue: function(arrayOfNames, casesensitive){
    for (let name of arrayOfNames){
      if (this.hasValue(name, casesensitive))
        return name;
    }
    return false;
  }
}

```

 * [discussion about regex for css colors](https://gist.github.com/olmokramer/82ccce673f86db7cda5e)