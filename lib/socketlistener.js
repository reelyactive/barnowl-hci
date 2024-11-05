/**
 * Copyright reelyActive 2016-2024
 * Adapted from node-bluetooth-hci-socket example by Sandeep Mistry (c) 2015
 * We believe in an open Internet of Things
 */


const BluetoothHciSocket = require('@stoprocent/bluetooth-hci-socket');
const HciPacket = require('./hcipacket');


/**
 * SocketListener Class
 * Listens for data on a HCI socket.
 */
class SocketListener {

  /**
   * SocketListener constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    let self = this;
    options = options || {};

    this.decoder = options.decoder;
    this.path = options.path;
    this.origin = 'socket';
    if(this.path) {
      this.origin = this.path;
    }

    openHciSocket(options.path, function(err, socket) {
      if(err) {
        console.log('barnowl-hci:', err);
        return;
      }
      else {
        self.socket = socket;
        handleSocketEvents(self);
      }
    });

  }

}


/**
 * Handle events on the given socket.
 * @param {SocketListener} instance The SocketListener instance.
 */
function handleSocketEvents(instance) {
  instance.socket.on('data', function(data) {
    let time = new Date().getTime();
    instance.decoder.handleHciData(data, instance.origin, time);
  });
  instance.socket.on('error', function(err) {
    console.log('barnowl-hci:', err);
  });
}


/**
 * Open the HCI socket based on the given path.
 * @param {String} path Path to HCI socket, ex: TBD.
 * @param {function} callback The function to call on completion.
 */
function openHciSocket(path, callback) {
  let bluetoothHciSocket = new BluetoothHciSocket();

  if(path) {
    bluetoothHciSocket.bindRaw([ path ]);
  }
  else {
    bluetoothHciSocket.bindRaw();
  }
  setFilter(bluetoothHciSocket);
  bluetoothHciSocket.start();
  //setEventMask(bluetoothHciSocket);    // Maintain the default values
  //setLeEventMask(bluetoothHciSocket);  //   unless otherwise required
  setScanEnable(bluetoothHciSocket, false, true);
  setScanParameters(bluetoothHciSocket);
  setScanEnable(bluetoothHciSocket, true, true);

  callback(null, bluetoothHciSocket); // TODO: include error
  readBdAddr(bluetoothHciSocket);
}


/**
 * Set the event mask of the Bluetooth HCI Socket.
 * @param {Object} socket The Bluetooth HCI Socket.
 */
function setEventMask(socket) {
  const cmd = Buffer.alloc(12);

  // See Bluetooth Core Specification 5.4,Vol. 4, Part E: 7.3.1
  const eventMask = Buffer.from('fffffbff07f8bf3d', 'hex'); // TODO: tweak

  // header
  cmd.writeUInt8(HciPacket.HCI_COMMAND_PKT, 0);
  cmd.writeUInt16LE(HciPacket.SET_EVENT_MASK_CMD, 1);

  // length
  cmd.writeUInt8(eventMask.length, 3);

  eventMask.copy(cmd, 4);

  socket.write(cmd);
}


/**
 * Set the LE event mask of the Bluetooth HCI Socket.
 * @param {Object} socket The Bluetooth HCI Socket.
 */
function setLeEventMask(socket) {
  const cmd = Buffer.alloc(12);

  // See Bluetooth Core Specification 5.4,Vol. 4, Part E: 7.3.1
  const leEventMask = Buffer.from('1fff000000000000', 'hex'); // TODO: tweak

  // header
  cmd.writeUInt8(HciPacket.HCI_COMMAND_PKT, 0);
  cmd.writeUInt16LE(HciPacket.LE_SET_EVENT_MASK_CMD, 1);

  // length
  cmd.writeUInt8(leEventMask.length, 3);

  leEventMask.copy(cmd, 4);

  socket.write(cmd);
}


/**
 * Set the filters of the Bluetooth HCI Socket.
 * @param {Object} socket The Bluetooth HCI Socket.
 */
function setFilter(socket) {
  let filter = Buffer.alloc(14);
  let typeMask = (1 << HciPacket.HCI_EVENT_PKT);
  let eventMask1 = (1 << HciPacket.EVT_CMD_COMPLETE) |
                   (1 << HciPacket.EVT_CMD_STATUS);
  let eventMask2 = (1 << (HciPacket.EVT_LE_META_EVENT - 32));
  let opcode = 0;

  filter.writeUInt32LE(typeMask, 0);
  filter.writeUInt32LE(eventMask1, 4);
  filter.writeUInt32LE(eventMask2, 8);
  filter.writeUInt16LE(opcode, 12);

  socket.setFilter(filter);
}


/**
 * Set the scan parameters of the Bluetooth HCI Socket.
 * @param {Object} socket The Bluetooth HCI Socket.
 */
function setScanParameters(socket) {
  let cmd = Buffer.alloc(11);

  // header
  cmd.writeUInt8(HciPacket.HCI_COMMAND_PKT, 0);
  cmd.writeUInt16LE(HciPacket.LE_SET_SCAN_PARAMETERS_CMD, 1);

  // length
  cmd.writeUInt8(0x07, 3);

  // data
  cmd.writeUInt8(0x01, 4);      // type: 0 -> passive, 1 -> active
  cmd.writeUInt16LE(0x0010, 5); // internal, ms * 1.6
  cmd.writeUInt16LE(0x0010, 7); // window, ms * 1.6
  cmd.writeUInt8(0x00, 9);      // own address type: 0 -> public, 1 -> random
  cmd.writeUInt8(0x00, 10);     // filter: 0 -> all event types

  socket.write(cmd);
}


/**
 * Set the scan state of the Bluetooth HCI Socket.
 * @param {Object} socket The Bluetooth HCI Socket.
 */
function setScanEnable(socket, enabled, duplicates) {
  let cmd = Buffer.alloc(6);

  // header
  cmd.writeUInt8(HciPacket.HCI_COMMAND_PKT, 0);
  cmd.writeUInt16LE(HciPacket.LE_SET_SCAN_ENABLE_CMD, 1);

  // length
  cmd.writeUInt8(0x02, 3);

  // data
  cmd.writeUInt8(enabled ? 0x01 : 0x00, 4);    // enabled:    0 (no), 1 (yes)
  cmd.writeUInt8(duplicates ? 0x01 : 0x00, 5); // duplicates: 0 (no), 1 (yes)

  socket.write(cmd);
}


/**
 * Read the Bluetooth MAC address of the adapter.
 * @param {Object} socket The Bluetooth HCI Socket.
 */
function readBdAddr(socket) {
  let cmd = Buffer.alloc(4);

  // header
  cmd.writeUInt8(HciPacket.HCI_COMMAND_PKT, 0);
  cmd.writeUInt16LE(HciPacket.READ_BD_ADDR_CMD, 1);

  // length
  cmd.writeUInt8(0x0, 3);

  socket.write(cmd);
};


module.exports = SocketListener;
