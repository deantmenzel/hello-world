class URLParameters {

  static _useridkey = null;
  static _strategyidkey = null;

  static _params = new URLSearchParams(document.location.search);
  static _userid = null;
  static _strategyid = null;

  static _initialise(key) {
    let value = ((this._params.has(key)) && this._params.get(key)) || null;
    return value;
  }

  static get id() {
    return this._userid
  }

  static set useridkey(key) {
    this._useridkey = key;
    this._userid = this._initialise(this._useridkey);
  }

  static set strategyidkey(key) {
    this._strategyidkey = key;
    this._strategyid = this._initialise(this._strategyidkey);
  }

  static get strategy() {
    return this._strategyid
  }

  static remove(key) {
    this._params.delete(key);
    let querystring = this._params.toString();
    return (querystring == '') ? '' : `?${querystring}`;
  }

}

/**
 * Retrieve JSON data from a provided URL
 * @param {string} url - the https:// location of the JSON file. 
 * @param {boolean} nocache - true or omitted for forced fetch, false for cached fetch
 * @returns {promise} - a parsed JSON object
 */
class RemoteJSON {

  static retrieve (url, nocache) {
    nocache = (nocache === undefined) ? true : nocache;
    let querystring = (nocache) ? `?${new Date().getTime()}` : ``;
    return fetch(`${url}${querystring}`, {
      method: 'GET',
      headers : {
        'Content-Type': 'application/json'
      }
    }
    ).then(response => response.json())
  }

}

/**
 * Some wrapper around localStorage methods to capture errors, etc.
 */
class Storage {

  static setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    }
    catch {
      console.warn('Failed to save value to local storage. Local storage may be full.');
    }
  }

  static getItem(key) {
    return localStorage.getItem(key);
  }

  static removeItem(key) {
    localStorage.removeItem(key);
  }

}

class Convert {

  static toCamelCase(text) {
    let STR = text.toLowerCase()
      .trim()
      .split(/[ -_]/g)
      .map(word => word.replace(word[0], word[0].toString().toUpperCase()))
      .join('');
    return STR.replace(STR[0], STR[0].toLowerCase());  
  }

}


export { URLParameters, RemoteJSON, Storage, Convert }