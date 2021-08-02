document.addEventListener('readystatechange', (event) => {
  console.log(`ReadyState: ${document.readyState}`);
});

document.addEventListener('DOMContentLoaded', (event) => {
  console.log(`DOMContentLoaded`);
  buildDb()
});

window.addEventListener('load', (event) => {
  console.log(`WindowLoaded`);
});

const buildDb = () => {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return;
    console.log(xhr);
    if (xhr.status >= 200 && xhr.status < 300) {
      console.log(JSON.parse(xhr.responseText));
    }
  };
  xhr.open('GET', '../db/index.json');
  xhr.send();
}