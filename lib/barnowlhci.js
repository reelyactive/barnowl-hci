/**
 * Copyright reelyActive 2018
 * We believe in an open Internet of Things
 */


const EventEmitter = require('events').EventEmitter;
const SocketListener = require('./socketlistener.js');
const TestListener = require('./testlistener.js');
const HciDecoder = require('./hcidecoder.js');
const HciManager = require('./hcimanager.js');


/**
 * BarnowlHci Class
 * Converts Bluetooth HCI output into standard raddec events.
 * @param {Object} options The options as a JSON object.
 * @constructor
 */
class BarnowlHci extends EventEmitter {

  /**
   * BarnowlHci constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    super();
    options = options || {};

    this.listeners = [];
    this.hciManager = new HciManager({ barnowl: this });
    this.hciDecoder = new HciDecoder({ hciManager: this.hciManager });
  }

  /**
   * Add a listener to the given hardware interface.
   * @param {Class} ListenerClass The (uninstantiated) listener class.
   * @param {Object} options The options as a JSON object.
   */
  addListener(ListenerClass, options) {
    options = options || {};
    options.decoder = this.hciDecoder;

    let listener = new ListenerClass(options);
    this.listeners.push(listener);
  }

  /**
   * Handle and emit the given raddec.
   * @param {Raddec} raddec The given Raddec instance.
   */
  handleRaddec(raddec) {
    // TODO: observe options to normalise raddec
    this.emit("raddec", raddec);
  }

  /**
   * Handle and emit the given infrastructure message.
   * @param {Object} message The given infrastructure message.
   */
  handleInfrastructureMessage(message) {
    this.emit("infrastructureMessage", message);
  }
}


module.exports = BarnowlHci;
module.exports.SocketListener = SocketListener;
module.exports.TestListener = TestListener;
