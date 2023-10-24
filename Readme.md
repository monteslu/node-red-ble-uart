@hsync/node-red-ble-uart
========================
A simple set of [Node-RED](http://nodered.org) nodes for creating a BluetoothLE host (GATT) UART service.

It turns your node-red instance into a BLE peripheral that implements the [Nordic UART](https://developer.nordicsemi.com/nRF_Connect_SDK/doc/latest/nrf/libraries/bluetooth_services/services/nus.html) Service.

Think of it as a wireless serial cable port that you can connect to with bluetooth.

Available Nodes:
- uart-in
- uart-notify

Install
-------
Run the following command in your Node-RED user directory - typically `~/.node-red`

    npm install @hsync/node-red-ble-uart


Under the covers, these nodes are using [Bleno](https://github.com/abandonware/bleno) for bluetooth connectivity with node.js.

Make sure to install any dependencies Bleno has for your platform, such as [Raspberry Pi OS](https://github.com/abandonware/bleno#ubuntudebianraspbian)

also note, if on Linux you may want to make this adjustment so as not to require running as root:

```sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)```


Nodes
-----
After adding either or both uart-in or uart-notify nodes to your flow and deploying, your node-red instance is discoverable via BLE.  You can simply connect any bluetooth client (even webBluetooth!) to it and read/write data to your flow.

**uart-in**
This node will receive input from a connected client. Any data written to the RxCharacteristic BLE characteristic will inject a Buffer of that data to the flow.

**uart-notify**
A client that subscribes to the UART TxCharacteristic will get data when a message is sent to this node.

