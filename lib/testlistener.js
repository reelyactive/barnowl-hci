/**
 * Copyright reelyActive 2018
 * We believe in an open Internet of Things
 */


const DEFAULT_RADIO_DECODINGS_PERIOD_MILLISECONDS = 1000;
const DEFAULT_RSSI = -70;
const MIN_RSSI = -90;
const MAX_RSSI = -50;
const RSSI_RANDOM_DELTA = 5;
const TEST_ORIGIN = '00:00:00:00:00:00';


/**
 * TestListener Class
 * Provides a consistent stream of artificially generated HCI data.
 */
class TestListener {

  /**
   * TestListener constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    options = options || {};

    this.decoder = options.decoder;
    this.radioDecodingPeriod = options.radioDecodingPeriod ||
                               DEFAULT_RADIO_DECODINGS_PERIOD_MILLISECONDS;
    this.rssi = [ DEFAULT_RSSI ];

    emitAddress(this);
    setInterval(emitRadioDecodings, this.radioDecodingPeriod, this);
  }

}


/**
 * Emit simulated radio decoding packets
 * @param {TestListener} instance The given instance.
 */
function emitRadioDecodings(instance) {
  let time = new Date().getTime();
  let rssi = (256 + instance.rssi[0]).toString(16);
  let simulatedHciData = Buffer.from(
    '043e21020102006655443322111502010611074449555520657669746341796c656572' +
    rssi, 'hex'); 
  updateSimulatedRssi(instance);
  instance.decoder.handleHciData(simulatedHciData, TEST_ORIGIN, time);
}


/**
 * Emit simulated address packet
 * @param {TestListener} instance The given instance.
 */
function emitAddress(instance) {
  let time = new Date().getTime();
  let simulatedHciData = Buffer.from('040e0a01091000000000000000', 'hex');
  instance.decoder.handleHciData(simulatedHciData, TEST_ORIGIN, time);
}


/**
 * Update the simulated RSSI values
 * @param {TestListener} instance The given instance.
 */
function updateSimulatedRssi(instance) {
  for(let index = 0; index < instance.rssi.length; index++) {
    instance.rssi[index] += Math.floor((Math.random() * RSSI_RANDOM_DELTA) -
                                       (RSSI_RANDOM_DELTA / 2));
    if(instance.rssi[index] > MAX_RSSI) {
      instance.rssi[index] = MAX_RSSI;
    }
    else if(instance.rssi[index] < MIN_RSSI) {
      instance.rssi[index] = MIN_RSSI;
    }
  }
}


module.exports = TestListener;
