/**
 * Copyright reelyActive 2018
 * We believe in an open Internet of Things
 */


const HciPacket = require('./hcipacket');
const Raddec = require('raddec');
const advlib = require('advlib-identifier');


/**
 * HciManager Class
 * Manages the HCI interfaces.
 */
class HciManager {

  /**
   * HciManager constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    this.barnowl = options.barnowl;
    this.radiosByOrigin = {};
  }

  /**
   * Handle the given HCI packet
   * @param {Object} packet The HCI packet to handle.
   */
  handleHciPacket(packet) {
    switch(packet.type) {
      case HciPacket.TYPE_DECODED_RADIO_SIGNAL:
        handleDecodedRadioSignal(this, packet);
        break;
      case HciPacket.TYPE_READ_BD_ADDR_CMD:
        handleReadAddressCommand(this, packet);
        break;
    }
  }
}


/**
 * Translate and produce the given decoded radio signal as a Raddec.
 * @param {HciManager} instance The given HciManager instance.
 * @param {HciPacket} packet The decoded radio signal packet.
 */
function handleDecodedRadioSignal(instance, packet) {
  let isKnownOrigin = instance.radiosByOrigin.hasOwnProperty(packet.origin);

  if(isKnownOrigin) {
    let radio = instance.radiosByOrigin[packet.origin];
    packet.rssiSignature.forEach(function(entry) {
      entry.receiverId = radio.receiverId;
      entry.receiverIdType = radio.receiverIdType;
    });

    let raddec = new Raddec(packet);
    instance.barnowl.handleRaddec(raddec);
  }
}


/**
 * Handle the read address command, updating the radio details.
 * @param {HciManager} instance The given HciManager instance.
 * @param {HciPacket} packet The read address command packet.
 */
function handleReadAddressCommand(instance, packet) {
  instance.radiosByOrigin[packet.origin] = {
      receiverId: packet.address,
      receiverIdType: advlib.identifiers.TYPE_EUI48
  };

  instance.barnowl.handleInfrastructureMessage(packet);
}


module.exports = HciManager;
