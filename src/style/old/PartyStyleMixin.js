const sym = Symbol("sym");

const hasPartyStyle = new WeakSet();

function getDocChain(node) {
  const docs = [];
  let doc = node.shadowRoot ? node.shadowRoot : node.getRootNode();
  while (doc) {
    docs.push(doc);
    doc = doc.host ? doc.host.getRootNode() : null;
  }
  return docs;
}

function registerParentDocs(node) {
  const docs = getDocChain(node);
  for (let doc of docs) {
    if (!hasPartyStyle.has(doc)) {   //it might be possible to skip checking parents, but I don't know this for sure, so we check all documents always.
      makePartyStyle(doc);
      hasPartyStyle.add(doc);
    }
  }
  return docs;
}

function makePartyStyle(doc) {
  const rules = getPartRules(doc.styleSheets);
  if (!rules.length)
    return;
  const party = document.createElement("style");
  party.id = "PartyStyleWithJOI";
  for (let rule of rules) {
    party.innerText += rule.cssText;
  }
  const head = doc.querySelector("head");
  const root = head ? head : doc;
  root.appendChild(party);
}

const regex = /::(part|theme)\(\s*([\w\d]*\s*)\)(:([a-z]*)|)*/;

function getPartRules(styles) {
  const res = [];
  for (let i = 0; i < styles.length; i++) {
    try {
      let rules = styles[i].cssRules;
      for (let j = 0; j < rules.length; j++) {
        let rule = rules[j];
        if (rule.selectorText.match(/#party/))
          res.push(rule);
      }
    } catch (err) {
      //cannot read the rules due to CORS, so just continue
      //https://bugs.chromium.org/p/chromium/issues/detail?id=775525
    }
  }
  return res;
}

export const PartyStyleMixin = function (Base) {
  return class PartyStyleMixin extends Base {

    constructor() {
      super();
      this.parentDocs = undefined;
    }

    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();
      this.parentDocs = registerParentDocs(this);
      // this.styles = getParentDocs(this);
    }

    disconnectedCallback() {
      if (super.disconnectedCallback) super.disconnectedCallback();
      this.parentDocs = undefined;
    }
  }
};