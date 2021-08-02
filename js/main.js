const ais = new Object();

document.addEventListener('readystatechange', (event) => {
  console.log(`ReadyState: ${document.readyState}`);
});

document.addEventListener('DOMContentLoaded', (event) => {
  console.log(`DOMContentLoaded`);
  fetchdata('https://deantmenzel.github.io/hello-world/db/index.json', buildDB);
});

window.addEventListener('load', (event) => {
  console.log(`WindowLoaded`);
});

var fetchdata = (url, action) => {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return;
    if (xhr.status >= 200 && xhr.status < 300) {
      action(JSON.parse(xhr.responseText));
    }
  };
  xhr.open('GET', url);
  xhr.send();
}

var buildDB = (jsondata) => {
  ais["tradingdays"] = jsondata["tradingdays"];
  ais["tradingdays"].forEach((tradingday) => {
    fetchdata(`https://deantmenzel.github.io/hello-world/db/${tradingday}.json`, addTradingDay)
  })
}

var addTradingDay = (jsondata) => {
  ais[jsondata["date"]]["strategies"] = jsondata["strategies"]; 
  ais[jsondata["date"]]["components"] = jsondata["components"]; 
}