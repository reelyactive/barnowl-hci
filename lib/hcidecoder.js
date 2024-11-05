/**
 * Copyright reelyActive 2018-2024
 * We believe in an open Internet of Things
 */


const advlib = require('advlib-identifier');
const HciPacket = require('./hcipacket');


/**
 * HciDecoder Class
 * Decodes data streams from one or more HCI streams and forwards the
 * packets to the given HciManager instance.
 */
class HciDecoder {

  /**
   * HciDecoder constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    options = options || {};

    this.hciManager = options.hciManager;
    this.queuesByOrigin = {};
  }


  /**
   * Handle data from a HCI stream, specified by the origin
   * @param {Buffer} data The HCI data.
   * @param {String} origin The unique origin identifier of the source.
   * @param {Number} time The time of the data capture.
   */
  handleHciData(data, origin, time) {
    let hciPacket = null;
    let isEventPacket = (data.readUInt8(0) === HciPacket.HCI_EVENT_PKT);

    // See Bluetooth Core Specification 5.4,Vol. 4, Part E: 5.4.4
    if(isEventPacket) {
      let eventCode = data.readUInt8(1);
      let parameterTotalLength = data.readUInt8(2);
      let isLengthMismatch = (data.length !== (parameterTotalLength + 3));

      if(isLengthMismatch) {
        return;
      }

      // See Bluetooth Core Specification 5.4,Vol. 4, Part E: 7.7
      switch(eventCode) {

        // See Bluetooth Core Specification 5.4,Vol. 4, Part E: 7.7.65
        case HciPacket.EVT_CMD_COMPLETE:
          let command = data.readUInt16LE(4);

          switch(command) {
            // See Bluetooth Core Specification 5.4,Vol. 4, Part E: 7.4.6
            case HciPacket.READ_BD_ADDR_CMD:
              hciPacket = decodeBluetoothControllerAddress(data, origin, time);
              break;
            case HciPacket.LE_SET_SCAN_PARAMETERS_CMD:
            case HciPacket.LE_SET_SCAN_ENABLE_CMD:
            default:
              return;
          }

        // See Bluetooth Core Specification 5.4,Vol. 4, Part E: 7.7.65
        case HciPacket.EVT_LE_META_EVENT:
          let subEvent = data.readUInt8(3);

          switch(subEvent) {
            case HciPacket.EVT_LE_ADVERTISING_REPORT:
              hciPacket = decodeLeAdvertisingReport(data, origin, time);
              break;
          }

      }
    }

    if(hciPacket) {
      this.hciManager.handleHciPacket(hciPacket);
    }
  }
}


/**
 * Decode the address of the Bluetooth controller.
 * @param {Buffer} data The HCI data.
 * @param {String} origin The unique origin identifier of the source.
 * @param {Number} time The time of the data capture.
 */
function decodeBluetoothControllerAddress(data, origin, time) {
  let isCommandSucceeded = (data.readUInt8(6) === HciPacket.HCI_SUCCESS);

  if(!isCommandSucceeded) {
    return null;
  }

  let type = HciPacket.TYPE_READ_BD_ADDR_CMD;
  let bdAddr = data.slice(7);
  let address = bdAddr.toString('hex').match(/.{1,2}/g)
                                      .reverse().join('');
  let command = { address: address };

  return new HciPacket(type, command, origin, time);
}


/**
 * Decode the given LE Advertising Report packet.
 * @param {Buffer} data The HCI data.
 * @param {String} origin The unique origin identifier of the source.
 * @param {Number} time The time of the data capture.
 */
function decodeLeAdvertisingReport(data, origin, time) {
  let type = HciPacket.TYPE_DECODED_RADIO_SIGNAL;
  let gapAdvTypeMap = [ '0', '1', '6', '2', '4' ];
  let gapAdvType = data.readUInt8(5);  // 0 to 4, non-BLE spec
  let gapAddrType = data.readUInt8(6); // 0 = public, 1 = random
  let gapAddr = data.slice(7, 13);
  let gapAdvLength = data.length - 9;
  let transmitterId = convertRawAddress(gapAddr);
  let transmitterIdType = advlib.identifiers.TYPE_EUI48;
  if(gapAddrType > 0) {
    transmitterIdType = advlib.identifiers.TYPE_RND48;
  }
  let eir = data.slice(14, data.length - 1);
  let rssi = data.readInt8(data.length - 1);

  let packet = 4 * gapAddrType;                           // txAdd
  packet += gapAdvTypeMap[gapAdvType];                    // Type
  packet += ('0' + gapAdvLength.toString(16)).substr(-2); // Length
  packet += gapAddr.toString('hex');                      // Address
  packet += eir.toString('hex');                          // PDU

  let radioDecoding = {
      transmitterId: transmitterId,
      transmitterIdType: transmitterIdType,
      rssiSignature: [{ rssi: rssi }],
      packets: [ packet ]
  }

  return new HciPacket(type, radioDecoding, origin, time);
}


/**
 * Convert the given raw address to the standard format.
 * @param {Buffer} rawAddress The raw address to convert.
 */
function convertRawAddress(rawAddress) {
  let address = ('0' + rawAddress.readUInt8(5).toString(16)).substr(-2) +
                ('0' + rawAddress.readUInt8(4).toString(16)).substr(-2) +
                ('0' + rawAddress.readUInt8(3).toString(16)).substr(-2) +
                ('0' + rawAddress.readUInt8(2).toString(16)).substr(-2) +
                ('0' + rawAddress.readUInt8(1).toString(16)).substr(-2) +
                ('0' + rawAddress.readUInt8(0).toString(16)).substr(-2);
  return address;
}


module.exports = HciDecoder;
