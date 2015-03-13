'use strict';

var usbtinyisp = require('../');
var when = require('when');
var nodefn = require('when/node');
var ihex = require('intel-hex');
var fs = require('fs');

var data = fs.readFileSync('arduino-1.6.0/attiny85/blink.cpp.hex', { encoding: 'utf8' });

var options = {
  board: {
    name: 'Attiny85',
    signature: new Buffer([0x1e, 0x93, 0x0b]),
    pageSize: 64,
  },
  memory: {
    data: ihex.parse(data).data
  },
  pid: 3231,
  vid: 6017
};


// var efuse = 0xff; //how does ff become 50 80?
// var hfuse = 0xdf;
// var lfuse = 0x62;
// writeFuse.bind(null, tinyAVR, new Buffer([0x50, 0x08, 0x00, 0x00])),
// writeFuse.bind(null, tinyAVR, new Buffer([0x58, 0x08, 0x00, 0x00])),
// writeFuse.bind(null, tinyAVR, new Buffer([0x50, 0x00, 0x00, 0x00]))


var bootload = function(cb){
  return nodefn.bindCallback(when.promise(function(resolve, reject) {

    var tinyAVR;

    function open(){
      return when.promise(function(resolve, reject) {
        tinyAVR = new usbtinyisp(options);
        tinyAVR.open(function(err){
          if(err){ return reject(err); }
          return resolve();
        });
      });
    }

    function close(){
      return when.promise(function(resolve, reject) {
        tinyAVR.close(function(err){
          if(err){ return reject(err); }
          return resolve();
        });
      });
    }

    function setSCK(){
      return when.promise(function(resolve, reject) {
        tinyAVR.setSCK(function(err){
          if(err){ return reject(err); }
          return resolve();
        });
      });
    }

    function sendSync(){
      return when.promise(function(resolve, reject) {
        tinyAVR.spi(new Buffer([0xac, 0x53, 0x00, 0x00]), function(err){
          if(err){ return reject(err); }
          return resolve();
        });
      });
    }

    function sync(){

      return setSCK()
      .delay(50)
      .then(sendSync);
    }

    function getSignature1(){
      return when.promise(function(resolve, reject) {
        tinyAVR.spi(new Buffer([0x30, 0x00, 0x00, 0x00]), function(err, sig){
          if(err){ return reject(err); }
          return resolve(sig);
        });
      });
    }

    function getSignature2(){
      return when.promise(function(resolve, reject) {
        tinyAVR.spi(new Buffer([0x30, 0x00, 0x01, 0x00]), function(err, sig){
          if(err){ return reject(err); }
          return resolve(sig);
        });
      });
    }

    function getSignature3(){
      return when.promise(function(resolve, reject) {
        tinyAVR.spi(new Buffer([0x30, 0x00, 0x02, 0x00]), function(err, sig){
          if(err){ return reject(err); }
          return resolve(sig);
        });
      });
    }

    function verifySignature(){

      return getSignature1()
      .then(function(sig){
        if(options.board.signature[0] !== sig[3]){
          throw new Error('Signature does not match');
        }
      })
      .then(getSignature2)
      .then(function(sig){
        if(options.board.signature[1] !== sig[3]){
          throw new Error('Signature does not match');
        }
      })
      .then(getSignature3)
      .then(function(sig){
        if(options.board.signature[2] !== sig[3]){
          throw new Error('Signature does not match');
        }
      });
    }

    function erase(){
      return when.promise(function(resolve, reject) {
        tinyAVR.spi(new Buffer([0xac, 0x80, 0x00, 0x00]), function(err){
          if(err){ return reject(err); }
          return resolve();
        });
      });
    }

    function powerDown(){
      return when.promise(function(resolve, reject) {
        tinyAVR.powerDown(function(err){
          if(err){ return reject(err); }
          return resolve();
        });
      });
    }

    function upload(){

      var writeBytes = new Buffer(0);
      var useaddr;
      var pageaddr;

      function loadPage() {
        return when.promise(function(resolve, reject) {
          tinyAVR.writeFlash(0, pageaddr, writeBytes, function(err, result){
            if(err){ return reject(err); }
            return resolve();
          });
        });
      }

      function loadAddress() {
        return when.promise(function(resolve, reject) {
          var low = useaddr & 0xff;
          var high = (useaddr >> 8) & 0xff;

          var cmd = new Buffer([0x4c, high, low, 0x00]);

          tinyAVR.spi(cmd, function(err, result){
            if(err){ return reject(err); }
            return resolve();
          });

        });
      }

      function unspool(index) {
        return [index, index + options.board.pageSize];
      }

      function predicate(index) {
        return index > options.memory.data.length;
      }

      function handler(index) {

        pageaddr = index;
        useaddr = index >> 1;
        writeBytes = options.memory.data.slice(pageaddr, (options.memory.data.length > options.board.pageSize ? (pageaddr + options.board.pageSize) : options.memory.data.length - 1));

        return loadPage()
        .then(loadAddress)
        .delay(4);
      }

      return when.unfold(unspool, predicate, handler, 0);
    }

    open()
    .then(sync)
    .then(verifySignature)
    .then(erase)
    .then(sync)
    .then(upload)
    .then(powerDown)
    .finally(close)
    .then(function(){
      return resolve();
    },
    function(error){
      return reject(error);
    });

  }), cb);
};

bootload(console.log.bind(console));
