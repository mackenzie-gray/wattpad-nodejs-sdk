'use strict'

var url =   require('url');
var https = require('https');

var DEFAULT_ERROR_CODE = -1
var DEFAULT_TIMEOUT_MS = 5000

class WattpadClient {
  constructor(options) {
    this._clientId = options.clientId;
    this._clientSecret = options.clientSecret;
    this._accessToken = "";
  }

  generateAuthUrl(redirectUrl){
    return url.format({
      protocol: 'https',
      host: 'wattpad.com',
      pathname: '/oauth/code?',
      query: {
        client_id: this._clientId,
        response_type: 'code',
        scope: 'read'
      }
    });
  }

  setAccessToken(token){
    this._acessToken = token
  }

  WPRequest(options, callback) {
    const params = {
      host: 'api.wattpad.com',
      port: 443,
      method: options.method,
      path: '/v4/' + options.path
    };

    let req = https.request(params, function (res) {
      let body = []

      res.setEncoding('utf-8')
      res.on('data', function (data) {
        body.push(data)
      });
      res.on('end', function () {
        let payload
        const responseText = body.join('')
        try {
          payload = JSON.parse(responseText)
        } catch (err) {
          callback(new WPError('Failed to parse response', DEFAULT_ERROR_CODE), null)
          return
        }

        var statusCode = res.statusCode
        var statusType = Math.floor(res.statusCode / 100)

        if (statusType == 4 || statusType == 5) {
          var err = payload.errors[0]
          callback(new WPError(err.message, err.code), null)
        } else if (statusType == 2) {
          callback(null, payload.data || payload)
        } else {
          callback(new WPError('Unexpected response', DEFAULT_ERROR_CODE), null)
        }
      })
    }).on('error', function (err) {
      callback(new WPError(err.message, DEFAULT_ERROR_CODE), null)
    });

    req.setHeader('Content-Type', options.contentType || 'application/json')
    req.setHeader('Authorization', 'Bearer ' + this._accessToken)
    req.setHeader('Accept', 'application/json')
    req.setHeader('Accept-Charset', 'utf-8')

    req.setTimeout(DEFAULT_TIMEOUT_MS, function () {
      // Aborting a request triggers the 'error' event.
      req.abort()
    })

    if (options.data) {
      var data = options.data
      if (typeof data == 'object') {
        data = JSON.stringify(data)
      }
      req.write(data)
    }
    req.end()
  }
}

module.exports = WattpadClient;