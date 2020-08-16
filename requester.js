const request = require('request');

module.exports.get = function(url, callback){
  retry(url,150, 10000, callback)
}

let retry = (function() {
  let count = 0;
  return function(url, max, timeout, next) {
    request(url, function (error, response, body) {
      if(error){
        console.log(error)
        return
      }
      if (response.statusCode !== 200) {
        // console.log('fail');

        if (count++ < max) {
          return setTimeout(function() {
            retry(url, max, timeout, next);
          }, timeout);
        } else {
          console.log("ERRORED!")
          return next(new Error('max retries reached'), null);
        }
      }

      // console.log('success');
      next(null, body);
    });
  }
})();
