/*
 * axios
 *
 * sobird<i@sobird.me> at 2020/04/30 22:42:24 created.
 */

const axios = require("axios");
const iconv = require('iconv-lite');

axios.defaults.headers['User-Agent'] = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36';
axios.defaults.headers['cookie'] = 'AD_RS_COOKIE=20080919; _trs_uv=k9mhytb2_6_d7nw';
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

    return request;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
axios.interceptors.response.use(
  (response) => {
    const { config, data } = response;
    data.responseTiming = new Date().getTime() - config.requestTimeStamp;

    return Promise.resolve(data);
  },
  (error) => {
    return Promise.reject(error);
  }
);

module.exports = axios;
