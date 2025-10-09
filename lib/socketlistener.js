/**
 * Copyright reelyActive 2016-2025
 * Adapted from node-bluetooth-hci-socket example by Sandeep Mistry (c) 2015
 *   and @stoprocent/noble/hci-socket by Marek Serafin (c) 2025
 * We believe in an open Internet of Things
 */


const BluetoothHciSocket = require('@stoprocent/bluetooth-hci-socket');
const HciPacket = require('./hcipacket');


const DEFAULT_ENABLE_ACTIVE_SCANNING = false;
const DEFAULT_SCAN_INTERVAL_MILLISECONDS = 10;
const DEFAULT_SCAN_WINDOW_MILLISECONDS = 10;
const DEFAULT_KICK_INTERVAL_MILLISECONDS = 1000;


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
    this.enableActiveScanning = options.enableActiveScanning ||
                                DEFAULT_ENABLE_ACTIVE_SCANNING;
    this.scanIntervalMilliseconds = options.scanIntervalMilliseconds ||
                                    DEFAULT_SCAN_INTERVAL_MILLISECONDS;
    this.scanWindowMilliseconds = options.scanWindowMilliseconds ||
                                  DEFAULT_SCAN_WINDOW_MILLISECONDS;
    this.kickIntervalMilliseconds = options.kickIntervalMilliseconds ||
                                    DEFAULT_KICK_INTERVAL_MILLISECONDS;

    this.origin = 'socket';
    if(this.path) {
      this.origin = this.path;
    }

    openHciSocket(self, (err, socket) => {
      if(err) {
        return console.log('barnowl-hci:', err);
      }
      else {
        self.socket = socket;
        handleSocketEvents(self);
        setInterval(kick, self.kickIntervalMilliseconds, self.socket);
      }
    });

  }

}


/**
 * Handle events on the given socket.
 * @param {SocketListener} instance The SocketListener instance.
 */
function handleSocketEvents(instance) {
  instance.socket.on('data', (data) => {
    let time = new Date().getTime();
    let type = instance.decoder.handleHciData(data, instance.origin, time);
    if(type === HciPacket.TYPE_RESET_CMD) {
      init(instance.socket);
    }
  });
  instance.socket.on('error', (err) => {
    console.log('barnowl-hci:', err.message);
  });
}


/**
 * Open the HCI socket based on the given path.
 * @param {SocketListener} instance The SocketListener instance.
 * @param {function} callback The function to call on completion.
 */
function openHciSocket(instance, callback) {
  let bluetoothHciSocket = new BluetoothHciSocket();

  if(instance.path) {
    bluetoothHciSocket.bindRaw([ instance.path ]);
  }
  else {
    bluetoothHciSocket.bindRaw();
  }
  reset(bluetoothHciSocket);
  setFilter(bluetoothHciSocket);
  bluetoothHciSocket.start();
  setScanEnable(bluetoothHciSocket, false, true);
  setScanParameters(bluetoothHciSocket, instance.enableActiveScanning,
                    instance.scanIntervalMilliseconds,
                    instance.scanWindowMilliseconds);
  setScanEnable(bluetoothHciSocket, true, true);

  callback(null, bluetoothHciSocket); // TODO: include error
}


/**
 * Initialise the HCI socket (typically after a reset).
 * @param {Object} socket The Bluetooth HCI Socket.
 */
function init(socket) {
  setEventMask(socket);
  setLeEventMask(socket);
  readBdAddr(socket);
}


/**
 * Kick the HCI socket (to keep it up, running and scanning).
 * @param {Object} socket The Bluetooth HCI Socket.
 */
function kick(socket) {
  if(socket.isDevUp()) {
    setScanEnable(socket, true, true);
  }
  else { /* TODO: handle down/up cycle? */ }
}


/**
 * Reset the Bluetooth HCI Socket.
 * @param {Object} socket The Bluetooth HCI Socket.
 */
function reset(socket) {
  const cmd = Buffer.alloc(4);

  // header
  cmd.writeUInt8(HciPacket.HCI_COMMAND_PKT, 0);
  cmd.writeUInt16LE(HciPacket.RESET_CMD, 1);

  // length
  cmd.writeUInt8(0x00, 3);

  socket.write(cmd);
};


/**
 * Set the event mask of the Bluetooth HCI Socket.
 * @param {Object} socket The Bluetooth HCI Socket.
 */
function setEventMask(socket) {
  const cmd = Buffer.alloc(12);

  // See Bluetooth Core Specification 5.4,Vol. 4, Part E: 7.3.1
  const eventMask = Buffer.from('fffffbff07f8bf3d', 'hex'); // TODO: tweak?

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

  // See Bluetooth Core Specification 5.4,Vol. 4, Part E: 7.8.1
  const leEventMask = Buffer.from('1fff000000000000', 'hex'); // TODO: tweak?
   // TODO: Extended advertising: '1f00000000000000'

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
  let typeMask = (1 << HciPacket.HCI_COMMAND_PKT) |
                 (1 << HciPacket.HCI_EVENT_PKT) |
                 (1 << HciPacket.HCI_ACLDATA_PKT);
  let eventMask1 = (1 << HciPacket.EVT_DISCONN_COMPLETE) |
                   (1 << HciPacket.EVT_ENCRYPT_CHANGE) |
                   (1 << HciPacket.EVT_CMD_COMPLETE) |
                   (1 << HciPacket.EVT_CMD_STATUS) |
                   (1 << HciPacket.EVT_NUMBER_OF_COMPLETED_PACKETS);
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
 * @param {boolean} enableActiveScanning Passive or active scan.
 * @param {Number} scanIntervalMilliseconds Duration of scan interval.
 * @param {Number} scanWindowMilliseconds Duration of scan window.
 */
function setScanParameters(socket, enableActiveScanning,
                           scanIntervalMilliseconds, scanWindowMilliseconds) {
  // TODO: handle extended advertising
  let cmd = Buffer.alloc(11);
  let leScanInterval = convertScanDuration(scanIntervalMilliseconds);
  let leScanWindow = convertScanDuration(scanWindowMilliseconds);

  if(leScanWindow > leScanInterval) {
    leScanWindow = leScanInterval;
    console.log('barnowl-hci: scan window reduced to scan interval');
  }

  // header
  cmd.writeUInt8(HciPacket.HCI_COMMAND_PKT, 0);
  cmd.writeUInt16LE(HciPacket.LE_SET_SCAN_PARAMETERS_CMD, 1);

  // length
  cmd.writeUInt8(0x07, 3);

  // See Bluetooth Core Specification 5.4,Vol. 4, Part E: 7.8.10
  // data
  cmd.writeUInt8(enableActiveScanning ? 0x01 : 0x00, 4);
  cmd.writeUInt16LE(leScanInterval, 5); // 2.5ms to 10.24s in 0.625ms steps
  cmd.writeUInt16LE(leScanWindow, 7);   // 2.5ms to 10.24s in 0.625ms steps
  cmd.writeUInt8(0x00, 9);              // 0x00 = public device address
  cmd.writeUInt8(0x00, 10);             // 0x00 = unfiltered scanning policy

  socket.write(cmd);
}


/**
 * Set the scan state of the Bluetooth HCI Socket.
 * @param {Object} socket The Bluetooth HCI Socket.
 */
function setScanEnable(socket, enabled, duplicates) {
  // TODO: handle extended advertising
  let cmd = Buffer.alloc(6);

  // header
  cmd.writeUInt8(HciPacket.HCI_COMMAND_PKT, 0);
  cmd.writeUInt16LE(HciPacket.LE_SET_SCAN_ENABLE_CMD, 1);

  // length
  cmd.writeUInt8(0x02, 3);

  // See Bluetooth Core Specification 5.4,Vol. 4, Part E: 7.8.11
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


/**
 * Convert the given scan duration to a value within the valid range.
 * @param {Number} durationMilliseconds The duration in milliseconds.
 */
function convertScanDuration(durationMilliseconds) {
  let value = Math.round(durationMilliseconds / 0.625);

  if(value > 0x4000) {
    console.log('barnowl-hci: scan parameter reduced to maximum permitted value of 10.24s');
    return 0x4000;
  }
  else if(value < 0x0004) {
    console.log('barnowl-hci: scan parameter increased to minimum permitted value of 2.5ms');
    return 0x0004;
  }

  return value;
}


module.exports = SocketListener;
