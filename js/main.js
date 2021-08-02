const ais = new Array();

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
  // Append data in query string to 'disable' caching
  xhr.open('GET', url + "?" + (new Date()).getTime());
  xhr.send();
}

var buildDB = (jsondata) => {
  ais["tradingdays"] = jsondata["tradingdays"];
  ais["tradingdays"].forEach((tradingday) => {
    fetchdata(`https://deantmenzel.github.io/hello-world/db/${tradingday}.json`, addTradingDay)
  })
}

var addTradingDay = (jsondata) => {
  ais.push(jsondata)
  // The first json file loaded is the current day so its OK to process it at this point
  console.log(ais.length);
  ais.length == 1 && render()
}

var render = () => {
  let today = ais[0]; 
  var templates = document.querySelectorAll("template")
  var titleclone = templates[0].content.cloneNode(true);
  titleclone.querySelectorAll("time")[0].textContent = ais[0].date;
  document.body.appendChild(titleclone);
  var stratclone = templates[1].content.cloneNode(true);
  stratclone.querySelectorAll("dd")[0].textContent = ais[0].strategies[0].name
  document.body.appendChild(stratclone);
}