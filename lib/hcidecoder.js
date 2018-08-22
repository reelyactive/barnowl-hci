/**
 * Copyright reelyActive 2018
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
    if(data.readUInt8(0) === HciPacket.HCI_EVENT_PKT) {
      if(data.readUInt8(1) === HciPacket.EVT_LE_META_EVENT) {
        if(data.readUInt8(3) === HciPacket.EVT_LE_ADVERTISING_REPORT) {
          let hciPacket = decodeLeAdvertisingReport(data, origin, time);
          this.hciManager.handleHciPacket(hciPacket);
        }
      }
      else if(data.readUInt8(1) === HciPacket.EVT_CMD_COMPLETE) {
        let cmd = data.readUInt16LE(4);
        let result = data.slice(7);

        if(cmd === HciPacket.READ_BD_ADDR_CMD) {
          let type = HciPacket.TYPE_READ_BD_ADDR_CMD;
          let address = result.toString('hex').match(/.{1,2}/g)
                                              .reverse().join('');
          let command = { address: address };
          let hciPacket = new HciPacket(type, command, origin, time);

          this.hciManager.handleHciPacket(hciPacket);
        }
      }
    }  
  }
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
