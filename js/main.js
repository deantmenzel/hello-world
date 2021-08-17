const _ = {

  urlroot: 'https://deantmenzel.github.io/hello-world/',
  
  customHTMLelements: [
    'trading-day',
    'strategy-summary'
  ],
  
  loadtradingdayhistory: false,

  userid: null,

  /**
   * Get trading day index into _ object to drive loading of current (latest) day and prior days. 
   * If _.loadtradinghistory is false, do not load prior days
   * @param {json} jsondata - Data parsed in the _.fetch function
   */
   buildDB: (jsondata) => {
    _.tradingdayindex = jsondata;
    _.tradingdaydata = new Array();
    _.tradingdayindex.forEach((tradingDay, index) => {
      // For the moment, only do the current trading day
      index === 0 && _.fetchdata(`db/${tradingDay}.json`, index, false, _.addTradingDay) || 
      _.loadtradingdayhistory && _.fetchdata(`db/${tradingDay}.json`, index, false, _.addTradingDay)
    })
  },

  buildPage: () => {

  },

  /**
   * Setup user as soon as possible, and don't do anything else unless there is a valid user.
   */
  documentreadystatechange: () => {
    document.readyState === 'interactive' && _.fetchdata(`db/user.json`, null, false, _.setupUser)
    document.readyState === 'complete' && _.userid != null && _.defineCustomElements();
  },

  /**
   * Load both the index schema and metrics data files staight up, if there is a valid user.
   * Note that schema and metrics are cached because they are bigger files update very infrequently
   */
  domcontentloaded: () => {
    if(_.userid != null) {
      _.fetchdata(`db/index.json`, null, false, _.buildDB)
      _.fetchdata(`db/schema.json`, null, true, (jsondata) => _.schema = jsondata)
      _.fetchdata(`db/metrics.json`, null, true, (jsondata) => _.metrics = jsondata)
    }
  },

  /**
   * Add the data for each trading day to the tradingdaydata array. Being building page once the 
   * current (latest) trading day data has been added.
   * @param {json} jsondata - Strategy data for a specific day.
   * @param {integer} tradingdayindex - The index of the trading day, 0 is current (latest) day.
   */
  addTradingDay: (jsondata, tradingdayindex) => {
    _.tradingdaydata.push(jsondata)
    tradingdayindex === 0 && _.buildPage();
  },
  
  /**
   * Generate a single HTML element to fill the specified slot of a template.
   * @param {string} slotName - Name of slot.
   * @param {string} slotValue - Data to be inserted into slot's text node.
   * @param {string=} tagName - Name of HTML element to create. If not specified default to the 
   * data HTML element
   * @param {*string=} attributes - String of key=value pairs separated by semicolon.
   * @returns {HTMLelement} element - An HTML element, either <data> or <tagName> as specified by 
   * the tagName parameter of the function
   */
  createSlot: (slotName, slotValue, tagName, attributes) => {
    let element = document.createElement(tagName || 'data');
    slotValue && element.appendChild(document.createTextNode(slotValue));
    attributes = (attributes)?`slot=${slotName};${attributes}`:`slot=${slotName}`;
    attributes.split(';').forEach((attr) => {
      let pair = attr.split('=');
      element.setAttribute(pair[0], pair[1]);
    })
    return element;
  },

  /**
   * Define all custom HTML elements and add them to the CustomElementRegistry. There must be a 
   * corresponding HTML template for each custom element. The name of the corresponding template 
   * must be of form `template-${customElementName}`.
   * @param {string} customElementName - Name of custom HTML element
   */
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

  /**
   * Cycle through all custom elements in array _.customHTMLelements and define them.
   */
  defineCustomElements: () => {
    _.customHTMLelements.forEach(element => _.defineCustomElement(element))
  },

  /**
   * Get data from JSON data sources on host
   * @param {string} url - URL relative to _.urlroot of sourcve
   * @param {integer=} tradingdayindex - Index of trading day (0 is current or latest trading day)
   * @param {boolean=} cache - Default null/true to cache, false to force fetch
   * @param {function} action - Function to execute after data is retreived from source 
   */
  fetchdata: (url, tradingdayindex, cache, action) => {
    url = `${_.urlroot}${url}`;
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        action(JSON.parse(xhr.responseText), tradingdayindex);
      }
    };
    // Append query string with current datetime to 'disable' caching
    cache = (cache === false) ? `?${new Date().getTime()}` : ``;
    xhr.open('GET', `${url}${cache}`);
    xhr.send();
  },

  setupUser: () => {
    console.log(location.search)
  },

  windowload: () => {},

};

document.addEventListener('readystatechange', (event) => _.documentreadystatechange());
document.addEventListener('DOMContentLoaded', (event) => _.domcontentloaded());
window.addEventListener('load', (event) => _.windowload());

let render = () => {

  let el = document.createElement('trading-day');
  el.appendChild(_.createSlot('tradingdate', null, 'time', 'datetime=Wednesday, 12 July 2021'));
  document.body.appendChild(el);

  let el1 = document.createElement('strategy-summary');
  el1.appendChild(_.createSlot('strategy', 'US Equities Investing Strategy'));
  el1.appendChild(_.createSlot('status', 'There are no trades for today'));
  document.body.appendChild(el1);

  let el2 = document.createElement('strategy-summary');
  el2.appendChild(_.createSlot('strategy', 'US Speculative Trading Strategy'));
  el2.appendChild(_.createSlot('status', 'New trades! Exit one and enter another.'));
  document.body.appendChild(el2);

}