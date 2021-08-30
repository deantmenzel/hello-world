const $ = {

  tradingdaydata: [],

  documentreadystatechange: () => {
    document.readyState === 'interactive' &&
      $.get('userregistry')
        .then((userregistry) => $.setupUser(userregistry))
        .then(() => $.get([5,4,3,2,1]))
        .then((index) => $.addData(index, 'index'))
        .then(() => $.addTradingDayData())
        .then((tradingdaydata) => $.addData(tradingdaydata, $.tradingdaydata))
        .then(() => $.get('metrics'))
        .then((metrics) => $.addData(metrics, 'metrics'))
        .then(() => $.get('schema'))
        .then((schema) => $.addData(schema, 'schema'))
        .then(() => $.addHistory())
        .catch((error) => $.error(error))
  }, 

  setupUser: (data) => {
    console.log(data);
    let usererror = false;
    return new Promise((resolve, reject) => {
      (usererror) ? reject('user not found') : resolve('found user') 
    })
  },

  addData: (data, key) => {
    if (Array.isArray(key)) {
      console.log(`tradingdaydata=${data}`);
      key.push(data)
    } else {
      console.log(`${key}=${data}`);
      $[key] = data;
    }
  },

  addHistory: () => {
    $.index.slice(1).forEach(day => 
      $.addTradingDayData(day)
        .then((tradingdaydata) => $.addData(tradingdaydata, $.tradingdaydata))
    )
  },

  addTradingDayData: (day) => {
    day = (day === undefined) ? $.index[0] : day;
    return $.get(`trading day ${day}`)
  },

  error: (data) => {
    console.log(data)
  },

  get: (data) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => resolve(data), 500);
    })
  }

}

document.addEventListener('readystatechange', (event) => $.documentreadystatechange());
