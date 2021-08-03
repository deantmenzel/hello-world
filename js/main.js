const aiis = new Array();

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

var fetchdata = (url, action, param) => {
  var xhr = new XMLHttpRequest();
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

var buildDB = (jsondata) => {
  ais["tradingdays"] = jsondata["tradingdays"];
  ais["tradingdays"].forEach((tradingday, index) => {
    fetchdata(`https://deantmenzel.github.io/hello-world/db/${tradingday}.json`, addTradingDay, index)
  })
}

var addTradingDay = (jsondata, param) => {
  aiis.push(jsondata)
  // If the first trading day from index.json (param = 0) then render, else do nothing
  param == 0 && render(aiis[0])
}

var render = (today) => {
  today.strategies.forEach((strategy) => {
    console.log(`${strategy.id} ${strategy.action}`)
  })
  /*
  var templates = document.querySelectorAll("template")
  var titleclone = templates[0].content.cloneNode(true);
  titleclone.querySelectorAll("time")[0].textContent = ais[0].date;
  document.body.appendChild(titleclone);
  var stratclone = templates[1].content.cloneNode(true);
  stratclone.querySelectorAll("dd")[0].textContent = ais[0].strategies[0].name
  document.body.appendChild(stratclone);
  */
}