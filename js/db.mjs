/**
 * The static DB class is, in effect, the model in the classic model-view-controller application 
 * architecture model.
 */

// import { RemoteJSON, Convert } from './utilities.mjs';
let { RemoteJSON, Convert } = await import('./utilities.mjs');

class DB {

  static _path = './db/';
  static _indexsource = `${this._path}index.json`;
  static _index = null;
  static _schemasource = `${this._path}schema.json`;
  static _schema = null;
  static _metricssource = `${this._path}metrics.json`
  static _metrics = null;
  static _tradinghistory = [];
  static _todayindex = null;

  _today = null;
  _strategies = null;
  _components = null;
  _calendar = null;
  _metrics = null;
  _newtrades = false;

  static async build() {
    this._index = await RemoteJSON.retrieve(this._indexsource);
    this._todayindex = this._index[0];
    this._schema = await RemoteJSON.retrieve(this._schemasource, false);
    await this._addTradingDay(this._index[0]);
    this._metrics = await RemoteJSON.retrieve(this._metricssource, false);
  }

  static async loadhistory(user) {
    if(user.config.db.loadhistory) {
      this._index.slice(1).forEach((tradingdayindex) => this._addTradingDay(tradingdayindex, false))
    }
  }

  static async _addTradingDay(tradingdayindex, nocache) {
    nocache = (nocache === undefined) ? true : nocache;
    this._tradinghistory.push(
      await RemoteJSON.retrieve(`${this._path}${tradingdayindex}.json`, nocache)
    );
  }

  static get today() {
    return this._todayindex;
  }

  /**
   * Create an instance of data from the database. Either a full trading day, a strategy of a trading day, a component of a trading day, a market of a trading day, etc.
   * @param primarykey {string} Can be either a tradingday or metrics data object. 
   * @param user {object} The user object of a registered and logged-in user.
   * @returns 
   */
  constructor(primarykey, user) {
    if(primarykey === undefined || user === undefined) return;
    let config = user.config;
    let schema, schemalabel = null;
    let type = user.type;
    let strategyids = user.strategyids;
    let marketsymbols = user.marketsymbols;
    let data = DB._tradinghistory[DB._index.indexOf(parseInt(primarykey))];
    this._today = data[0];
    this._strategies = data[1].filter((strategy) => strategyids.includes(strategy[1]));
    this._components = (type !== 'Detailed') ? null : data[2];
    this._calendar = data[4];
    this._metrics = DB._metrics.filter((strategy) => strategyids.includes(strategy[1]));
    const actions = ['Enter', 'Exit', 'Rollover', 'Switch'];
    let strategyactions = [];
    this._strategies.forEach((strategy) => strategyactions.push(strategy[3]));
    actions.forEach((act) => {
      if(strategyactions.includes(act)) this._newtrades = true
    });
    
    /** 
     * Setup for market-status component
     * Set up field labels and data for the day: all driven by that specific day's data.
     * This means fields must be re-calculated for each different day.
     */ 
    schemalabel = 'market-status';
    this[`_${schemalabel}`] = {
      'parent' : [{
        'value' : '',
        'htmlelement': 'time',
        'attributes': `datetime=${this.date}`
      }],
      'child' : data[3].filter((market) => marketsymbols.includes(market[1]))
    };
    // Uncomment the following lines to give proper names to fields from the databse schema. This 
    // is not actually not required for proper functioning of site but may be useful for debugging.
    // schema = DB._schema[1][4];
    // schemalabel = schema[0].slice(0,1)[0];
    // config[schemalabel] = {
    //   'parent' : ['date'],
    //   'child' : []
    // };
    this[`_${schemalabel}`].child.forEach((market) => {
      // config[schemalabel].child.push(
      //   schema[0].slice(1).map((item) => `${market[1]}${item.replace(schemalabel, '')}`)
      // )
      market.shift();
    });

    /**
     * Setup for strategy-alert component
     * Set up field labels and data for the day: all driven by that specific day's data.
     * This means fields must be re-calculated for each different day.
     */
    let childdata = [];
    this.strategies.forEach((strategy) => {
      let alertdata = strategy.slice(2, 4); // strategy-name, strategy-action
      alertdata[0] = {
        'value' : alertdata[0], // strategy-name
        'htmlelement': 'a',
        'attributes' : `href=${strategy[1].replace('[Live] ', '')}` // strategy-index
      };
      (user.type !== 'Detailed') 
        ? alertdata.push(strategy[4]) // strategy-general-status-message 
        : alertdata.push(strategy[5]) // strategy-detailed-status-message
      childdata.push(alertdata);
    })
    this[`_strategy-alert`] = {
      'parent' : [
        (this.newtrades) ? 'ACTION ALERT!' : 'No new trades today',
        (this.newtrades) ? 'There are new trades to execute on ' : 'There are no new trades for ',
        {
          'value' : '',
          'htmlelement': 'time',
          'attributes': `datetime=${this.date}`
        }
      ],
      'child' : childdata
    }

    /**
     * Setup for strategy-status component
     * Set up field labels and data for the day: all driven by that specific day's data.
     * This means fields must be re-calculated for each different day.
     */
    this['_strategy-status'] = [];
    this.strategies.forEach((strategy) => {

      // console.log(strategy)

      let parent = [
        strategy[2], 
        {
          'value': strategy[6][0][9], 
          'htmlelement': 'span', 
          'attributes' : `data-sign=${((strategy[6][0][9] > 0 ) ? '+' : '-')}`
        }, // position-gain
        {'value': strategy[6][0][6], 'htmlelement': 'span' }, // position-duration
        {'value': strategy[6][0][5], 'htmlelement': 'span' } // position-entry-date
      ];
      this['_strategy-status'].push({
        'parent' : parent,
        'child' : []
      })
    });

    return this;
  }

  get date() {
    return this._today;
  }

  get ['market-status']() {
    return this['_market-status'];
  }

  get ['strategy-alert']() {
    return this['_strategy-alert'];
  }

  get ['strategy-status']() {
    return this['_strategy-status'];
  }

  get strategies() {
    return this._strategies;
  }

  get newtrades() {
    return this._newtrades;
  }

}

export { DB }