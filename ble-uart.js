const { EventEmitter } = require('events');
const os = require('os');
const bleno = require('@abandonware/bleno');
const getCharacteristics = require('./characteristics');

module.exports = function(RED) {
  const DEFAULT_SERIAL_SERVICE = '6e400001b5a3f393e0a9e50e24dcca9e';
  const { RxCharacteristic, TxCharacteristic } = getCharacteristics(bleno);
  const rx = new RxCharacteristic();
  const tx = new TxCharacteristic();
  let status = 'opening';
  const name = os.hostname();

  const serviceUuids = [DEFAULT_SERIAL_SERVICE];
  try {
    bleno.on('stateChange', (state) => {
      console.log('on -> stateChange: ' + state);
      if (state === 'poweredOn') {
        bleno.startAdvertising(name, serviceUuids, (error) => {
          if (error) {
            console.log(error);
          } else {
            // console.log('started advertising');
            status = 'advertising';
          } 
        });
      } else {
        bleno.stopAdvertising();
      }
    });

    bleno.on('error', (error) => {
      console.log('bleno error: ' + error);
    });
  } catch (e) {
    console.error(e);
  }
  

  bleno.on('disconnect', (clientAddress) => {
    // console.log('on -> disconnect: ' + clientAddress);
    status = 'disconnected';
  });

  bleno.on('accept', (clientAddress) => {
    // console.log('on -> accept: ' + clientAddress);
    status = 'connected';
  });


  bleno.on('advertisingStart', function(error) {
    console.log('on -> advertisingStart: ' + (error ? 'error ' + error : 'success'));

    if (!error) {

      bleno.setServices([
        new bleno.PrimaryService({
          uuid: DEFAULT_SERIAL_SERVICE,
          characteristics: [
            rx,
            tx,
          ]
        })
      ]);
    }
  });

  function BLEIn(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    console.log('blein config', config);
    node.emit_type = config.emit_type || 'string';

    if (status === 'opening' || status === 'disconnected' || status === 'advertising') {
      node.status({fill:'yellow',shape:'ring',text: status});
    }

    if (status === 'connected') {
      node.status({fill:'green',shape:'dot',text: status});
    }

    const onWrite = (data, offset, withoutResponse, callback) => {
      let payload = data;
      if (node.emit_type === 'string') {
        payload = data.toString('utf8');
      } else if (node.emit_type === 'hex') {
        payload = data.toString('hex');
      }
      node.send({
        payload,
        topic: 'uart-in',
      });
    };

    rx.events.on('write', onWrite);

    const onAccept = () => {
      node.status({fill:'green',shape:'dot',text: 'connected'});
    };

    const onDisconnect = () => {
      node.status({fill:'yellow',shape:'ring',text: 'advertising'});
    };

    bleno.on('accept', onAccept);
    bleno.on('disconnect', onDisconnect);

    node.on('close', () => {
      bleno.removeListener('accept', onAccept);
      bleno.removeListener('disconnect', onDisconnect);
      rx.events.removeListener('write', onWrite);
    });
  }
  RED.nodes.registerType('uart-in', BLEIn);

  function BLENotify(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    
    if (status === 'opening' || status === 'disconnected' || status === 'advertising') {
      node.status({fill:'yellow',shape:'ring',text: status});
    }

    if (status === 'connected') {
      node.status({fill:'green',shape:'dot',text: status});
    }

    node.on('input', async function(msg) {
      try {
        let payload = msg.payload;
        if (typeof payload === 'number') {
          payload = String(payload);
        }
        tx.send(Buffer.from(payload));

      } catch (e) {
        e.status = status;
        node.status({fill:'red',shape:'ring',text:'error'});
        node.error(e);
      }
    });

    const onAccept = () => {
      node.status({fill:'green',shape:'dot',text: 'connected'});
    };

    const onDisconnect = () => {
      node.status({fill:'yellow',shape:'ring',text: 'advertising'});
    };

    bleno.on('accept', onAccept);
    bleno.on('disconnect', onDisconnect);

    node.on('close', () => {
      bleno.removeListener('accept', onAccept);
      bleno.removeListener('disconnect', onDisconnect);
    });
  }
  RED.nodes.registerType('uart-notify', BLENotify);

}