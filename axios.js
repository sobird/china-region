/*
 * axios
 *
 * sobird<i@sobird.me> at 2020/04/30 22:42:24 created.
 */

const axios = require("axios");
const iconv = require("iconv-lite");
const fs = require("fs");
const path = require("path");

axios.defaults.headers["User-Agent"] =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36";

axios.defaults.withCredentials = true;
axios.defaults.timeout = 10000;
axios.defaults.responseType = "arraybuffer";
axios.defaults.transformResponse = [
  function (data) {
    // 对 data 进行任意转换处理
    return iconv.decode(data, "gbk");
  },
];
axios.defaults.baseURL =
  "http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2019/";

// 请求拦截器
axios.interceptors.request.use(
  (request) => {
    request.requestTimeStamp = new Date().getTime();
    // 是否序列化数据
    if (request.serialize) {
      request.data = querystring.stringify(request.data);
    }

    request.headers["cookie"] = get_cookie();

    return request;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
axios.interceptors.response.use(
  (response) => {
    const { config, data, headers } = response;
    data.responseTiming = new Date().getTime() - config.requestTimeStamp;

    set_cookie(headers["set-cookie"]);
    return Promise.resolve(data);
  },
  (error) => {
    return Promise.reject(error);
  }
);

function set_cookie(cookies = []) {
  let _cookies = [];
  cookies.forEach((item) => {
    let cookie = item.split(";");

    _cookies.push(cookie[0]);
  });

  if(_cookies.length == 0) {
      return;
  }

  _cookies.push('AD_RS_COOKIE=20080917');
  fs.writeFileSync(path.resolve(__dirname, "./cookie"),  _cookies.join(';'));
}

function get_cookie() {
    try{
        return fs.readFileSync(path.resolve(__dirname, "./cookie"), 'utf-8');
    } catch {
        return '';
    }
    
  }

module.exports = axios;
