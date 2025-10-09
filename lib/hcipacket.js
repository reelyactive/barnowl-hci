/**
 * Copyright reelyActive 2018-2025
 * We believe in an open Internet of Things
 */


// Constants (HCI)
// See: https://github.com/stoprocent/noble/blob/main/lib/hci-socket/hci.js
const HCI_COMMAND_PKT = 0x01;
const HCI_ACLDATA_PKT = 0x02;
const HCI_EVENT_PKT = 0x04;
const EVT_DISCONN_COMPLETE = 0x05;
const EVT_ENCRYPT_CHANGE = 0x08;
const EVT_CMD_COMPLETE = 0x0e;
const EVT_CMD_STATUS = 0x0f;
const EVT_NUMBER_OF_COMPLETED_PACKETS = 0x13;
const EVT_LE_META_EVENT = 0x3e;
const EVT_LE_ADVERTISING_REPORT = 0x02;
const OGF_INFO_PARAM = 0x04;
const OGF_HOST_CTL = 0x03;
const OGF_LE_CTL = 0x08;
const OCF_READ_BD_ADDR = 0x0009;
const OCF_LE_SET_SCAN_PARAMETERS = 0x000b;
const OCF_LE_SET_SCAN_ENABLE = 0x000c;
const OCF_SET_EVENT_MASK = 0x0001;
const OCF_LE_SET_EVENT_MASK = 0x0001;
const LE_SET_SCAN_PARAMETERS_CMD = OCF_LE_SET_SCAN_PARAMETERS |
                                   OGF_LE_CTL << 10;
const LE_SET_SCAN_ENABLE_CMD = OCF_LE_SET_SCAN_ENABLE | OGF_LE_CTL << 10;
const SET_EVENT_MASK_CMD = OCF_SET_EVENT_MASK | (OGF_HOST_CTL << 10);
const LE_SET_EVENT_MASK_CMD = OCF_LE_SET_EVENT_MASK | (OGF_LE_CTL << 10);
const READ_BD_ADDR_CMD = OCF_READ_BD_ADDR | (OGF_INFO_PARAM << 10);
const HCI_SUCCESS = 0;


// Constants (Type)
const TYPE_DECODED_RADIO_SIGNAL = 'decodedRadioSignal';
const TYPE_READ_BD_ADDR_CMD = 'readAddressCommand';
const TYPE_UNDEFINED = 'undefined';


/**
 * HciPacket Class
 * Represents a Bluetooth HCI packet
 */
class HciPacket {

  /**
   * HciPacket constructor
   * @param {String} type Type of HCI packet.
   * @param {Object} content Content of the given packet type.
   * @param {Object} origin Origin of the data stream.
   * @param {String} time The time of the data capture.
   * @constructor
   */
  constructor(type, content, origin, time) {
    content = content || {};

    // DecodedRadioSignal
    if(type === TYPE_DECODED_RADIO_SIGNAL) {
      this.type = TYPE_DECODED_RADIO_SIGNAL;
      this.transmitterId = content.transmitterId;
      this.transmitterIdType = content.transmitterIdType;
      this.packets = content.packets;
      this.rssiSignature = content.rssiSignature;
    }

    // ReadAddressCommmand
    else if(type === TYPE_READ_BD_ADDR_CMD) {
      this.type = TYPE_READ_BD_ADDR_CMD;
      this.address = content.address;
    }

    // Undefined
    else {
      this.type = TYPE_UNDEFINED;
    }

    this.origin = origin;
    this.time = time;
  }

}


module.exports = HciPacket;
module.exports.HCI_COMMAND_PKT = HCI_COMMAND_PKT;
module.exports.HCI_ACLDATA_PKT = HCI_ACLDATA_PKT;
module.exports.HCI_EVENT_PKT = HCI_EVENT_PKT;
module.exports.EVT_DISCONN_COMPLETE = EVT_DISCONN_COMPLETE;
module.exports.EVT_ENCRYPT_CHANGE = EVT_ENCRYPT_CHANGE;
module.exports.EVT_CMD_COMPLETE = EVT_CMD_COMPLETE;
module.exports.EVT_CMD_STATUS = EVT_CMD_STATUS;
module.exports.EVT_NUMBER_OF_COMPLETED_PACKETS =
                                               EVT_NUMBER_OF_COMPLETED_PACKETS;
module.exports.EVT_LE_META_EVENT = EVT_LE_META_EVENT;
module.exports.EVT_LE_ADVERTISING_REPORT = EVT_LE_ADVERTISING_REPORT;
module.exports.OGF_INFO_PARAM = OGF_INFO_PARAM;
module.exports.OGF_LE_CTL = OGF_LE_CTL;
module.exports.OCF_READ_BD_ADDR = OCF_READ_BD_ADDR;
module.exports.OCF_LE_SET_SCAN_PARAMETERS = OCF_LE_SET_SCAN_PARAMETERS;
module.exports.OCF_LE_SET_SCAN_ENABLE = OCF_LE_SET_SCAN_ENABLE;
module.exports.LE_SET_SCAN_PARAMETERS_CMD = LE_SET_SCAN_PARAMETERS_CMD;
module.exports.LE_SET_SCAN_ENABLE_CMD = LE_SET_SCAN_ENABLE_CMD;
module.exports.SET_EVENT_MASK_CMD = SET_EVENT_MASK_CMD;
module.exports.LE_SET_EVENT_MASK_CMD = LE_SET_EVENT_MASK_CMD;
module.exports.READ_BD_ADDR_CMD = READ_BD_ADDR_CMD;
module.exports.HCI_SUCCESS = HCI_SUCCESS;
module.exports.TYPE_DECODED_RADIO_SIGNAL = TYPE_DECODED_RADIO_SIGNAL;
module.exports.TYPE_READ_BD_ADDR_CMD = TYPE_READ_BD_ADDR_CMD;
module.exports.TYPE_UNDEFINED = TYPE_UNDEFINED;
