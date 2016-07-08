'use strict'

var url =   require('url');
var https = require('https');
var queryString = require('querystring');

var DEFAULT_ERROR_CODE = -1
var DEFAULT_TIMEOUT_MS = 5000

class WattpadClient {
  constructor(options) {
    this._clientId = options.clientId;
    this._clientSecret = options.clientSecret;
    this._accessToken = "";
  }

  generateAuthUrl(redirectURI){
    return url.format({
      protocol: 'https',
      host: 'wattpad.com',
      pathname: '/oauth/code',
      query: {
        api_key: this._clientId,
        response_type: 'code',
        scope: 'read',
        redirect_uri: redirectURI
      }
    });
  }

  exchangeCode(code, redirect_uri, cb) {
    this.getAccessToken({
      apiKey: this._clientId,
      secret: this._clientSecret,
      authCode: code,
      redirectUri: redirect_uri,
      grantType: 'authorizationCode'
    }, cb)
  }

  setAccessToken(token){
    this._acessToken = token
  }

  getAccessToken(params, callback) {
    this.WPRequest({
      method: 'POST',
      path: 'auth/token',
      contentType: 'application/x-www-form-urlencoded',
      data: queryString.stringify(params)
    }, (err, data) => {
      if(!err) {
        this._accessToken = data.auth.token
        this._username = data.auth.username
      }
      callback(err, data);
    });
  }

  // Gets all the reading lists for a specified user
  getReadingLists(username, params, callback){
    this.WPRequest({
      method: 'GET',
      path: 'users/' + username + '/lists',
      data: queryString.stringify(params)
    }, (err, data) => {
      callback(err, data);
    });
  }

  //Adds a list of stories to a users library
  addToLibrary(username, stories, callback){
    this.WPRequest({
      method: 'POST',
      path: 'users/' + username + '/library',
      contentType: 'application/x-www-form-urlencoded',
      data: queryString.stringify(stories),
      needsAuth: true
    }, (err, data) => {
      callback(err, data);
    });
  }

  // Makes a request to the Wattpad API
  WPRequest(options, callback) {
    const needsAuth = options.needsAuth || false;
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
          callback(new Error('Failed to parse response', DEFAULT_ERROR_CODE), null)
          return
        }

        console.log('PAYLOAD: ', payload);
        var statusCode = res.statusCode
        var statusType = Math.floor(res.statusCode / 100)

        if (statusType == 4 || statusType == 5) {
          var err = payload.errors[0]
          callback(new Error(err.message, err.code), null)
        } else if (statusType == 2) {
          callback(null, payload.data || payload)
        } else {
          callback(new Error('Unexpected response', DEFAULT_ERROR_CODE), null)
        }
      })
    }).on('error', function (err) {
      callback(new Error(err.message, DEFAULT_ERROR_CODE), null)
    });

    let header_auth = this._clientId;
    if( needsAuth ){
      req.setHeader('Api-Key', this._clientId)
      header_auth = 'Bearer ' + this._accessToken
    }

    req.setHeader('Content-Type', options.contentType || 'application/json')
    req.setHeader('Authorization', header_auth);
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
