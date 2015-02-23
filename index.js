'use strict';

var util = require('util');
var EE = require('events').EventEmitter;
var usb = require('usb');
var statics = require('./lib/statics');

var usbtiny = function(options) {
	if (!(this instanceof usbtiny))
	{ return new usbtiny(); }

  EE.call(this);

  this.device = usb.findByIds(options.vid, options.pid);

	this.device.open();

};
util.inherits(usbtiny, EE);


usbtiny.prototype.setSCK = function(cb){

	var requesttype = 0xC0;
	var requestid = statics.USBTINY_POWERUP;
	var val = statics.SCK_DEFAULT;
	var index = statics.RESET_LOW;
	var length = 0;

	console.log('requesttype: ', requesttype.toString(16), ' requestid:', requestid.toString(16), ' val: ', val.toString(16), ' index: ', index.toString(16), ' buflen: ', length.toString(16));

	this.device.controlTransfer(
		requesttype, requestid, val, index, length, cb);
};

usbtiny.prototype.spi = function(buffer, cb){

	var requesttype = 0xC0;
	var requestid = statics.USBTINY_SPI;
	var val = (buffer[1] << 8) | buffer[0];
	var index = (buffer[3] << 8) | buffer[2];
	var length = 4;

	console.log('requesttype: ', requesttype.toString(16), ' requestid:', requestid.toString(16), ' val: ', val.toString(16), ' index: ', index.toString(16), ' buflen: ', length.toString(16));

	this.device.controlTransfer(
		requesttype, requestid, val, index, length, cb);
};

usbtiny.prototype.readFlash = function(delay, address, length, cb){

	var requesttype = 0xC0;
	var requestid = statics.USBTINY_FLASH_READ;

	console.log('requesttype: ', requesttype.toString(16), ' requestid:', requestid.toString(16), ' val: ', delay.toString(16), ' index: ', address.toString(16), ' buflen: ', length.toString(16));

	this.device.controlTransfer(
		requesttype, requestid, delay, address, length, cb);
};

//only supporting paged for now
usbtiny.prototype.writeFlash = function(delay, address, buffer, cb){

	var requesttype = 0x40;
	var requestid = statics.USBTINY_FLASH_WRITE;

	console.log('requesttype: ', requesttype.toString(16), ' requestid:', requestid.toString(16), ' val: ', delay.toString(16), ' index: ', address.toString(16), ' buflen: ', buffer.length.toString(16));
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

	console.log('requesttype: ', requesttype.toString(16), ' requestid:', requestid.toString(16), ' val: ', val.toString(16), ' index: ', index.toString(16), ' buflen: ', length.toString(16));

	this.device.controlTransfer(
		requesttype, requestid, val, index, length, cb);
};


//only supporting paged for now and eeprom isnt paged on tiny85

// usbtiny.prototype.readEeprom = function(delay, address, number, cb){
// 	this.device.controlTransfer(
// 		0xC0,
// 		statics.USBTINY_EEPROM_READ,
// 		delay,
// 		address, number, cb);
// };

// usbtiny.prototype.writeEeprom = function(delay, address, number, cb){
// 	this.device.controlTransfer(
// 		0xC0,
// 		statics.USBTINY_EEPROM_WRITE,
// 		delay,
// 		address, number, cb);
// };

module.exports = usbtiny;



// module.exports = {
//   sync: sync,
//   getSignature: getSignature,
//   verifySignature: verifySignature,
//   setOptions: setOptions,
//   enterProgrammingMode: enterProgrammingMode,
//   upload: upload,
//   loadAddress: loadAddress,
//   loadPage: loadPage,
//   verify: verify,
//   verifyPage: verifyPage,
//   exitProgrammingMode: exitProgrammingMode,
//   bootload: bootload
// };