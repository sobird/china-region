/**
 * 抓取中国行政区域数据
 * 注：需要在axios.js文件中自行设置cookie和user-agent
 *
 * sobird<i@sobird.me> at 2020/04/30 21:22:17 created.
 */

const axios = require("./axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const puppeteer = require('puppeteer');

// 数据
getTownData();

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

// 获取县数据
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

      await (async function () {
        try {
          let html = await axios.get(path);
          const $ = cheerio.load(html);
          $(".countytable .countytr").each((index, item) => {
            let value = $("td", item).eq(0).text();
            let label = $("td", item).eq(1).text();

            res[ccode][value] = label;
          });

          let _tmp = Object.keys(res[ccode]);
          // 如果获取不到country数据，则抓取town数据
          if (_tmp.length == 0) {
            $(".towntable .towntr").each((index, item) => {
              let value = $("td", item).eq(0).text();
              let label = $("td", item).eq(1).text();

              res[ccode][value] = label;
            });
          }

          console.log(res[ccode]);
        } catch (err) {
          console.log("超时重试...");
          arguments.callee();
        }
      })();
    }
  }

  writeFileSync("./data/county.js", res);
}

// 获取镇数据
async function getTownData() {
    const counties = require("./data/county");
    const city_codes = Object.keys(counties);
  
    let res = {};
  
    for (let i = 0; i < city_codes.length; i++) {
      let city_code = city_codes[i];
      let county_codes = Object.keys(counties[city_code]);
  
      for (let i = 0; i < county_codes.length; i++) {
        let county_code = county_codes[i];
  
        let province_code = county_code.slice(0, 2);
        let city_code = county_code.slice(2, 4);
        let county_ccode = county_code.slice(0, 6);
  
        let path = "/" + province_code + "/" + city_code + "/" + county_ccode + ".html";
  
        res[county_code] = {};
  
        await sleep(3000);
  
        await (async function () {
          try {
            console.log(path);
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.goto(axios.defaults.baseURL + path);

            const data = await page.evaluate((county_code) => {
                let data = {};
                let list = [...document.querySelectorAll('.towntable .towntr')];
                list.forEach(el => {
                    const t = el.innerText.split('\t');
                    data[t[0]] = t[1];
                });

                if(list.length == 0) {
                    list = [...document.querySelectorAll('.villagetable .villagetr')];
                    list.forEach(el => {
                        const t = el.innerText.split('\t');
                        data[t[0]] = t[1];
                    });
                }

                return data;
              }, county_code);

              res[county_code] = data;
              


            // let html = await axios.get(path);
            // const $ = cheerio.load(html);
            // $(".towntable .towntr").each((index, item) => {
            //   let value = $("td", item).eq(0).text();
            //   let label = $("td", item).eq(1).text();
  
            //   res[county_code][value] = label;
            // });
  
            // let _tmp = Object.keys(res[county_code]);
            // // 如果获取不到country数据，则抓取town数据
            // if (_tmp.length == 0) {
            //   $(".villagetable .villagetr").each((index, item) => {
            //     let value = $("td", item).eq(0).text();
            //     let label = $("td", item).eq(1).text();
  
            //     res[county_code][value] = label;
            //   });
            // }
  
            console.log(res[county_code]);
            await browser.close();
          } catch (err) {
            console.log("超时重试...", err);
            await arguments.callee();
          }
        })();
      }
    }
  
    writeFileSync("./data/town.js", res);
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
