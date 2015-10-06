'use strict';

var util = require('util');
var EE = require('events').EventEmitter;
var usb = require('usb');
var statics = require('./lib/statics');

var usbtiny = function(options) {
  if (!(this instanceof usbtiny))
  { return new usbtiny(); }

  EE.call(this);

  this.device = {};
  this.log = options.log || function(){};
  this.options = options;
};
util.inherits(usbtiny, EE);

usbtiny.prototype.open = function(cb){
  var self = this;

  usb.findByIds(this.options.vid, this.options.pid, function(err, device){
    if(err) { return cb(err); }

    self.device = device;
    self.device.open(cb);
  });
};

usbtiny.prototype.close = function(cb){

  this.device.close(cb);
};

usbtiny.prototype.setSCK = function(val, cb){
  if (!cb) {
    var cb = val;
    var val = statics.SCK_DEFAULT;
  }

  var requesttype = 0xC0;
  var requestid = statics.USBTINY_POWERUP;
  var index = statics.RESET_LOW;
  var length = 0;

  this.log('requesttype: ', requesttype.toString(16), ' requestid:', requestid.toString(16), ' val: ', val.toString(16), ' index: ', index.toString(16), ' buflen: ', length.toString(16));

  this.device.controlTransfer(
    requesttype, requestid, val, index, length, cb);
};

usbtiny.prototype.spi = function(buffer, cb){

  var requesttype = 0xC0;
  var requestid = statics.USBTINY_SPI;
  var val = (buffer[1] << 8) | buffer[0];
  var index = (buffer[3] << 8) | buffer[2];
  var length = 4;

  this.log('requesttype: ', requesttype.toString(16), ' requestid:', requestid.toString(16), ' val: ', val.toString(16), ' index: ', index.toString(16), ' buflen: ', length.toString(16));

  this.device.controlTransfer(
    requesttype, requestid, val, index, length, cb);
};

usbtiny.prototype.readFlash = function(delay, address, length, cb){

  var requesttype = 0xC0;
  var requestid = statics.USBTINY_FLASH_READ;

  this.log('requesttype: ', requesttype.toString(16), ' requestid:', requestid.toString(16), ' val: ', delay.toString(16), ' index: ', address.toString(16), ' buflen: ', length.toString(16));

  this.device.controlTransfer(
    requesttype, requestid, delay, address, length, cb);
};

//only supporting paged for now
usbtiny.prototype.writeFlash = function(delay, address, buffer, cb){

  var requesttype = 0x40;
  var requestid = statics.USBTINY_FLASH_WRITE;

  this.log('requesttype: ', requesttype.toString(16), ' requestid:', requestid.toString(16), ' val: ', delay.toString(16), ' index: ', address.toString(16), ' buflen: ', buffer.length.toString(16));
  // console.log(buffer.toString('hex'));

  this.device.controlTransfer(
    requesttype, requestid, delay, address, buffer, cb);
};

usbtiny.prototype.powerDown = function(cb){

  var requesttype = 0xC0;
  var requestid = statics.USBTINY_POWERDOWN;
  var val = 0;
  var index = 0;
  var length = 0;

  this.log('requesttype: ', requesttype.toString(16), ' requestid:', requestid.toString(16), ' val: ', val.toString(16), ' index: ', index.toString(16), ' buflen: ', length.toString(16));

  this.device.controlTransfer(
    requesttype, requestid, val, index, length, cb);
};

//only supporting paged for now and eeprom isnt paged on tiny85
usbtiny.prototype.readEeprom = function(delay, address, length, cb){

  var requesttype = 0xC0;
  var requestid = statics.USBTINY_EEPROM_READ;

  this.log('requesttype: ', requesttype.toString(16), ' requestid:', requestid.toString(16), ' val: ', delay.toString(16), ' index: ', address.toString(16), ' buflen: ', length.toString(16));

  this.device.controlTransfer(
    requesttype, requestid, delay, address, length, cb);
};

usbtiny.prototype.writeEeprom = function(delay, address, buffer, cb){

  var requesttype = 0x40;
  var requestid = statics.USBTINY_EEPROM_WRITE;

  this.log('requesttype: ', requesttype.toString(16), ' requestid:', requestid.toString(16), ' val: ', delay.toString(16), ' index: ', address.toString(16), ' buflen: ', buffer.toString('hex'));

  this.device.controlTransfer(
   requesttype, requestid, delay, address, buffer, cb);
};

module.exports = usbtiny;

