# Wattpad NodeJS SDK

Steamline your development of apps with Wattpad's API by using this nodejs.

## Getting Started 

1. Download the module from NPM.    
  ```npm install --save wattpad-sdk```
2. Import the module into your app somewhere    
  ```var WattpadClient = require('wattpad-sdk')```
3. Make sure you have an **API Key** and a **secret** from Wattpad. You can get these [here](http://developer.wattpad.com)
4. Once you have the keys you are ready to create a WattpadClient inside your application. All you need to do to initialize this is create a new `WattpadClient` object and pass it the clientId and clientSecret from Wattpad.    
  ```var wp = new WattpadClient({ clientId: 'abcdefg123456', clientSecret: '1912308409123890' });```
5. Now you're ready to start using the client!

## Authenticating Users

**TODO:** write the rest of the guide

