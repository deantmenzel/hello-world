const _ = {

  customHTMLelements: [
    'trading-day',
    'strategy-summary',
    'user-unauthorised',
    'user-welcome'
  ],
  
  // If true, load data from days prior to current (latest) trading day
  // Warning this could be a lot of data (each day >20k)
  loadtradingdayhistory: false,

  urlroot: 'https://deantmenzel.github.io/hello-world/',
  
  userdata: null,

  // Expiry data on cookie for site access, applies to all users
  userexpiry: 'Fri, 01 Jul 2022 00:00:00 UTC',

  /**
   * Add the data for each trading day to the tradingdaydata array. Being building page once the 
   * current (latest) trading day data has been added.
   * @param {json} jsondata - Strategy data for a specific day.
   * @param {integer} tradingdayindex - The index of the trading day, 0 is current (latest) day.
   */
   addTradingDay: (jsondata, tradingdayindex) => {
    _.tradingdaydata.push(jsondata)
    tradingdayindex === 0 && render();
  },
  
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
    _.defineCustomElements();
    _.fetchdata(`db/index.json`, null, false, _.buildDB)
    _.fetchdata(`db/schema.json`, null, true, (jsondata) => _.schema = jsondata)
    _.fetchdata(`db/metrics.json`, null, true, (jsondata) => _.metrics = jsondata)
  },

  /**
   * Cookie management: get, set and reset. Common technique for reset is setting
   * expires=Thu, 01 Jan 1970 00:00:00 UTC; 
   */
  cookie: {
    get: (name) => {
      return _.getKeyValue(document.cookie, name, '; ');
    },
    set: (name, value) => {
      document.cookie = `${name}=${value}; `
    },
    reset: (name) => {
      if(name != undefined) _.cookie.set(name, '');
      else document.cookie.split('; ').forEach(pair => _.cookie.set(pair.split('=')[0], ''));
    }
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
   * Setup user as soon as possible. Load continues with _.userLoaded after _.setupUser has
   * succeeded.
   */
  documentreadystatechange: () => {
    document.readyState === 'interactive' && _.fetchdata(`db/user.json`, null, false, _.setupUser)
  },

  domcontentloaded: () => {},

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

  /**
   * Get the value of a key from a delimited string of key=value pairs
   * @param {string} source Delimited string of key=value paris (e.g. cookie, querystring)
   * @param {string} name Name of key 
   * @param {string} delimiter Delimiter used in source to separate key=value paris
   * @returns 
   */
  getKeyValue: (source, key, delimiter) => {
    let value = null;
      try {
        value = source
          .split(delimiter)
          .find(item => item.startsWith(key))
          .split('=')[1];
      } catch {}
      return (value == null || value == '') ? null : value;
  },

  /**
   * Check for user id in cookie and url. URL user id takes precedence. If URL user id then save it 
   * to cookie user id. If no cookie user id then assume first time access with that device and 
   * display first-time welcome screen. If not first time then proceed to site. If no user id in 
   * cookie or URl, then unauthorised access and error. If user id in URL then replace loaction 
   * without user id to preserve identification privacy.
   * @param {JSON} userregistry - User data, array of users
   */
  setupUser: (userregistry) => {
    const userid = 'userid';
    const cookieuserid = _.cookie.get(userid);
    const urluserid = _.getKeyValue(location.search.substr(1), userid, ';');
    
    let resolveduserid = null;
    let firsttime = false;

    // Four access cases to resolve user id
    switch(true) {
      // 1. Url contains userid (first-time access) 
      case (cookieuserid == null && urluserid != null):
        firsttime = true;
      // 2. Both url and cookie contain userid (using email linke after first-time access).
      case (cookieuserid != null && urluserid != null): 
        resolveduserid = urluserid;
        break;
      // 3. Cookie userid only (directly accessing site without urluserid in querystring)
      case(cookieuserid != null && urluserid == null) :
        resolveduserid = cookieuserid;
        break;
      // 4. No userid anyhere. Illegal access, resolveduserid remains null, forces error handling
      case(cookieuserid == null && urluserid == null) :
        break;
    }

    if(resolveduserid != null) {
      let userdata = userregistry.filter(user => user[0] === resolveduserid);
      // There must be one and only one match, if not then is an error
      if(userdata.length == 1) {
        _.userdata = userdata[0]
        // If first-time access, set up cookie
        if(firsttime) {
          _.cookie.set('userid', resolveduserid);
          _.cookie.set('first-time', 'true');
          _.cookie.set('expires', _.userexpiry);
        } else {
          if(_.cookie.get('first-time') == 'true') {
            let el = document.createElement('user-welcome');
            el.appendChild(_.createSlot('name', `${_.userdata[2]}`));
            document.body.getElementsByTagName('main').item(0).appendChild(el);
            _.cookie.reset('first-time')
          }
          _.buildPage();
        }
        // Remove userid from browser location to 'hide' it
        if(urluserid != null) {
          let search = location.search.replace(`userid=${resolveduserid}`, '');
          search = (search ==='?') ? '' : search;
          location.replace(`${location.href.split(/[?]/)[0]}${search}`)
        }
      } else {
        // Multiple or no matches in user registry, set to null to invoke error
        resolveduserid = null
      }
    }

    // Error handling
    if(resolveduserid === null) {
      _.defineCustomElement('user-unauthorised');
      let el = document.createElement('user-unauthorised');
      document.body.getElementsByTagName('main').item(0).appendChild(el);
    }

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