/**
 * 抓取中国行政区域数据
 *
 * sobird<i@sobird.me> at 2020/04/30 21:22:17 created.
 */

const axios = require("./axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

// 城市数据
 getCountyData();

// 获取城市数据保存到city.js文件中
async function getCityData() {
  const province = require("./data/province")["86"];
  const pcodes = Object.keys(province);

  let res = {};

  for (let i = 0; i < pcodes.length; i++) {
    let code = pcodes[i];

    if (code !== "710000" && code !== "910000") {
      // 过滤掉港澳台
      let pcode = code.slice(0, 2);
      let path = "/" + pcode + ".html";

      res[code] = {};

      await sleep(1500);
      console.log(code);
      let html = await axios.get(path);
      const $ = cheerio.load(html);

      $(".citytable .citytr").each((index, item) => {
        let value = $("td", item).eq(0).text();
        let label = $("td", item).eq(1).text();

        res[code][value] = label;
      });
    }
  }

  writeFileSync("./data/city.js", res);
}

async function getCountyData() {
  const cities = require("./data/city");
  const pcodes = Object.keys(cities);

  let res = {};

  for (let i = 0; i < pcodes.length; i++) {
    let pcode = pcodes[i];
    let ccodes = Object.keys(cities[pcode]);

    for (let i = 0; i < ccodes.length; i++) {
      let ccode = ccodes[i];

      let _pcode = ccode.slice(0, 2);
      let _ccode = ccode.slice(0, 4);

      let path = "/" + _pcode + "/" + _ccode + ".html";

      res[ccode] = {};

      await sleep(250);

      (function () {
        console.log(ccode);

        axios
          .get(path)
          .then((html) => {
            const $ = cheerio.load(html);
            $(".countytable .countytr").each((index, item) => {
              let value = $("td", item).eq(0).text();
              let label = $("td", item).eq(1).text();

              res[ccode][value] = label;

              
            });

            let _tmp = Object.keys(res[ccode]);
            if(_tmp.length == 0) {
                console.log(html);
            }

            console.log(res[ccode]);
          })
          .catch((err) => {
            console.log("超时重试...");
            arguments.callee();
          });
      })();
    }
  }

  console.log(res);

  writeFileSync("./data/country.js", res);
}

// 延迟执行
function sleep(time = 0) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(1);
      } catch (e) {
        reject(0);
      }
    }, time);
  });
}
function writeFileSync(name, data) {
  fs.writeFileSync(
    path.resolve(__dirname, name),
    `module.exports=${JSON.stringify(data)}`
  );
}
