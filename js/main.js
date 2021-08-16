const aiis = new Array();

document.addEventListener('readystatechange', (event) => {
  // console.log(`ReadyState: ${document.readyState}`);
  if(document.readyState === 'complete') {
    defineCustomElements();
  }
});

document.addEventListener('DOMContentLoaded', (event) => {
  // console.log(`DOMContentLoaded`);
  fetchdata('https://deantmenzel.github.io/hello-world/db/index.json', buildDB);
});

window.addEventListener('load', (event) => {
  //console.log(`WindowLoaded`);
});

let fetchdata = (url, action, param) => {
  let xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return;
    if (xhr.status >= 200 && xhr.status < 300) {
      action(JSON.parse(xhr.responseText), param);
    }
  };
  // Append data in query string to 'disable' caching
  xhr.open('GET', url + "?" + (new Date()).getTime());
  xhr.send();
}

let buildDB = (jsondata) => {
  aiis["index"] = jsondata["tradingdays"];
  aiis["tradingDays"] = new Array();
  aiis.index.forEach((tradingDay, index) => {
    // For the moment, only do the current trading day
    index === 0 && fetchdata(`https://deantmenzel.github.io/hello-world/db/${tradingDay}.json`, addTradingDay, index)
  })
}

var addTradingDay = (jsondata, param) => {
  aiis.tradingDays.push(jsondata)
  // If the first trading day from index.json (param = 0) then render, else do nothing
  param === 0 && render()
}

/*
var render = () => {
  var today = aiis.tradingDays.filter(item => item.date == aiis.index[0])[0];
  today.strategies.forEach((strategy) => {
    if(strategy.position1) {
      var test = today.components.filter(item => item.id === strategy.position1.component);
      console.log(test);
    }
  })
}
*/

let defineCustomElements = () => {
  let customElementNames = ['trading-day','strategy-summary'];
  customElementNames.forEach(element => defineCustomElement(element))
}

let defineCustomElement = (customElementName) => {
  customElements.define(customElementName,
    class extends HTMLElement {
      static get observedAttributes() {}
      constructor() {
        super();
        let template = document.getElementById(`template-${customElementName}`);
        let newInstance = template.content.cloneNode(true);
        const shadowRoot = this.attachShadow({mode: 'open'}).appendChild(newInstance);
      }
      connectedCallback() {}
      disconnectedCallback() {}
      attributeChangedCallback(attrName, oldValue, newValue) {}
    }
  )
};

let render = () => {

  /*
   * Create a slot with data. Defaults to data html element unless agName specified
   * @param slotName string Name of slot 
   * @param slotValue string Value of slot
   * @param tagName string 
   * @param attributes string of key=value pairs, same syntax as document.cookie 
  */
  let createSlot = (slotName, slotValue, tagName, attributes) => {
    let element = document.createElement(tagName || 'data');
    slotValue && element.appendChild(document.createTextNode(slotValue));
    attributes = (attributes)?`slot=${slotName};${attributes}`:`slot=${slotName}`;
    attributes.split(';').forEach((attr) => {
      let pair = attr.split('=');
      element.setAttribute(pair[0], pair[1]);
    })
    return element;
  }

  let el = document.createElement('trading-day');
  el.appendChild(createSlot('tradingdate', null, 'time', 'datetime=Wednesday, 12 July 2021'));
  document.body.appendChild(el);

  let el1 = document.createElement('strategy-summary');
  el1.appendChild(createSlot('strategy', 'US Equities Investing Strategy'));
  el1.appendChild(createSlot('status', 'There are no trades for today'));
  document.body.appendChild(el1);

  let el2 = document.createElement('strategy-summary');
  el2.appendChild(createSlot('strategy', 'US Speculative Trading Strategy'));
  el2.appendChild(createSlot('status', 'New trades! Exit one and enter another.'));
  document.body.appendChild(el2);

}