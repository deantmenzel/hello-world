const _ = {

  urlroot: 'https://deantmenzel.github.io/hello-world/',
  customHTMLelements: [
    'trading-day',
    'strategy-summary'
  ],
  loadtradingdayhistory: false,

  documentreadystatechange: () => {
    document.readyState === 'complete' && _.defineCustomElements();
  },

  domcontentloaded: () => {
    _.fetchdata(`db/index.json`, _.buildDB)
  },

  windowload: () => {},

  /*
   * Add the data for each trading day to the tradingdaydata array. Always render current day, but * only load previous day(s) if _.loadtradinghistory is true.
   * @param json Trading day data
   * @param integer The index of the trading day, 0 is current day 
   */
  addTradingDay: (jsondata, tradingdayindex) => {
    _.tradingdaydata.push(jsondata)
    // If the first trading day from index.json then render, else do nothing
    tradingdayindex === 0 && render() || _.loadtradingdayhistory && render();
  },
  
  buildDB: (jsondata) => {
    _.tradingdayindex = jsondata;
    _.tradingdaydata = new Array();
    _.tradingdayindex.forEach((tradingDay, index) => {
      // For the moment, only do the current trading day
      _.fetchdata(`db/${tradingDay}.json`, _.addTradingDay, index)
    })
  },
  
  defineCustomElement: (customElementName) => {
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
  },

  defineCustomElements: () => {
    _.customHTMLelements.forEach(element => _.defineCustomElement(element))
  },

  fetchdata: (url, action, param) => {
    url = `${_.urlroot}${url}`;
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

};

document.addEventListener('readystatechange', (event) => _.documentreadystatechange());
document.addEventListener('DOMContentLoaded', (event) => _.domcontentloaded());
window.addEventListener('load', (event) => _.windowload());

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