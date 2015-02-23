'use strict';

var usbtinyisp = require('../');
var async = require('async');
var intel_hex = require('intel-hex');
var fs = require('fs');

var data = fs.readFileSync('arduino-1.6.0/attiny85/blink.cpp.hex', { encoding: 'utf8' });

var hex = intel_hex.parse(data).data;

var pageSize = 64;

var options = {
	pid: 3231,
	vid: 6017
};

// var efuse = 0xff; //how does ff become 50 80?
// var hfuse = 0xdf;
// var lfuse = 0x62;
// writeFuse.bind(null, tinyAVR, new Buffer([0x50, 0x08, 0x00, 0x00])),
// writeFuse.bind(null, tinyAVR, new Buffer([0x58, 0x08, 0x00, 0x00])),
// writeFuse.bind(null, tinyAVR, new Buffer([0x50, 0x00, 0x00, 0x00]))


var sync = function(tinyAVR, cb){

	async.series([
	  tinyAVR.setSCK.bind(tinyAVR),
	  function(cbdone){
	  	setTimeout(cbdone, 50);
	  },
	  tinyAVR.spi.bind(tinyAVR, new Buffer([0xac, 0x53, 0x00, 0x00])),
	], function(error, results){
			cb(error, results);
	});
};

var getSignature = function(tinyAVR, cb){

	async.series([
	  tinyAVR.spi.bind(tinyAVR, new Buffer([0x30, 0x00, 0x00, 0x00])),
	  tinyAVR.spi.bind(tinyAVR, new Buffer([0x30, 0x00, 0x01, 0x00])),
	  tinyAVR.spi.bind(tinyAVR, new Buffer([0x30, 0x00, 0x02, 0x00]))
	], function(error, results){

			// undefined,
			// <Buffer 00 30 00 1e>,
			// <Buffer 00 30 00 93>,
			// <Buffer 00 30 00 0b> ] //signature is 1e 93 0b
			cb(error, results);
	});
};


var erase = function(tinyAVR, cb){
	tinyAVR.spi(new Buffer([0xac, 0x80, 0x00, 0x00]), cb);
};

var writeFuse = function(tinyAVR, buffer, cb){
	tinyAVR.spi(buffer, cb);
};

// //poll thing
// var something = function(tinyAVR, cb){
// 	tinyAVR.spi(new Buffer([0xff, 0xff, 0x00, 0x00]), cb);
// };

function loadPage(tinyAVR, address, buffer, timeout, done) {
	tinyAVR.writeFlash(0, address, buffer, done);
}

function loadAddress(tinyAVR, useaddr, timeout, done) {

	var low = useaddr & 0xff;
	var high = (useaddr >> 8) & 0xff;

	var cmd = new Buffer([0x4c, high, low, 0x00]);
	tinyAVR.spi(cmd, done);
}

function upload(stream, hex, pageSize, timeout, done) {
	// console.log("program");

	var pageaddr = 0;
	var writeBytes;
	var useaddr;

	// program individual pages
  async.whilst(
    function() { return pageaddr < hex.length; },
    function(pagedone) {
			// console.log("program page");
      async.series([
      	function(cbdone){
      		useaddr = pageaddr >> 1;
      		cbdone();
      	},
        function(cbdone){
					writeBytes = hex.slice(pageaddr, (hex.length > pageSize ? (pageaddr + pageSize) : hex.length - 1));
        	cbdone();
        },
        function(cbdone){
        	loadPage(stream, pageaddr, writeBytes, timeout, cbdone);	
        },
        function(cbdone){
        	loadAddress(stream, useaddr, timeout, cbdone);
        },
        function(cbdone){
					// console.log("programmed page");
        	pageaddr =  pageaddr + writeBytes.length;
        	setTimeout(cbdone, 4);
        }
      ],
      function(error) {
      	// console.log("page done");
      	pagedone(error);
      });
    },
    function(error) {
    	// console.log("upload done");
    	done(error);
    }
  );
}

var bootload = function(){

	var tinyAVR = new usbtinyisp(options);

	async.series([
		sync.bind(null, tinyAVR),
	  getSignature.bind(null, tinyAVR),
	  erase.bind(null, tinyAVR),
	  sync.bind(null, tinyAVR),
		upload.bind(null, tinyAVR, hex, pageSize, 2000),
	  tinyAVR.powerDown.bind(tinyAVR)

		], function(error, results){
			if(!error)
			{
			  console.log("programing SUCCESS!");
			  process.exit(0);
			}
			console.log(error, results);

	});
};

bootload();
