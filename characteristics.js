const { EventEmitter } = require('events');

const DEFAULT_TRANSMIT_CHARACTERISTIC = '6e400002b5a3f393e0a9e50e24dcca9e';
const DEFAULT_RECEIVE_CHARACTERISTIC =  '6e400003b5a3f393e0a9e50e24dcca9e';

function getCharacteristics(bleno) {
  class RxCharacteristic extends bleno.Characteristic {
    constructor() {
      super({
        uuid: DEFAULT_RECEIVE_CHARACTERISTIC,
        properties: ['write', 'writeWithoutResponse'],
        value: null
      });
      this.events = new EventEmitter();
    }

    onWriteRequest(data, offset, withoutResponse, callback) {
      this._value = data;
  
      // console.log('RxCharacteristic - onWriteRequest: value = ' + this._value.toString('hex'));
  
      // if (this._updateValueCallback) {
      //   console.log('EchoCharacteristic - onWriteRequest: notifying');
  
      //   this._updateValueCallback(this._value);
      // }
      this.events.emit('write', data, offset, withoutResponse, callback);
      callback(this.RESULT_SUCCESS);
    }

    
  }

  class TxCharacteristic extends bleno.Characteristic {
    constructor() {
      super({
        uuid: DEFAULT_TRANSMIT_CHARACTERISTIC,
        properties: ['notify'],
        value: null
      });
      this.events = new EventEmitter();
    }

    onSubscribe(maxValueSize, updateValueCallback) {
      // console.log('TxCharacteristic - onSubscribe');
      this._updateValueCallback = updateValueCallback;
      this.events.emit('subscribed', maxValueSize, updateValueCallback);
    }
  
    onUnsubscribe() {
      // console.log('TxCharacteristic - onUnsubscribe');
      this._updateValueCallback = null;
      this.events.emit('unsubscribed');
    }

    send(data) {
      if (this._updateValueCallback) {
        // console.log('TxCharacteristic - onWriteRequest: notifying');
  
        this._updateValueCallback(data);
      }
    }
  }

  return {
    RxCharacteristic,
    TxCharacteristic,
  };
}

module.exports = getCharacteristics;