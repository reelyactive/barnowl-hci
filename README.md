barnowl-hci
===========

__barnowl-hci__ converts RF decodings from the Bluetooth Host Controller Interface (HCI) into software-developer-friendly JSON: a real-time stream of [raddec](https://github.com/reelyactive/raddec/) objects which facilitate any and all of the following applications:
- RFID: _what_ is present, based on the device identifier?
- RTLS: _where_ is it relative to the receiving devices?
- M2M: _how_ is its status, based on any payload included in the packet?

__barnowl-hci__ is a lightweight [Node.js package](https://www.npmjs.com/package/barnowl-hci) that can run on resource-constrained edge devices.  It is typically run behind a [barnowl](https://github.com/reelyactive/barnowl) instance which is included in the [Pareto Anywhere](https://www.reelyactive.com/pareto/anywhere/) open source middleware suite.


Installation
------------

    npm install barnowl-hci

If installation fails on your system, validate [these installation requirements](#installation-requirements).


Quick Start
-----------

Clone this repository, install package dependencies with `npm install`, and then from the root folder run at any time:

    npm start

If you observe a permissions error (ex: EPERM), either [assign the necessary privileges](#assigning-privileges) (recommended) or run as root (_not_ recommended).  __barnowl-hci__ will set the local Bluetooth radio to scan and print any processed [raddec](https://github.com/reelyactive/raddec) data to the console.


Hello barnowl-hci!
------------------

The following code will listen to _simulated_ hardware and output packets to the console:

```javascript
const BarnowlHci = require('barnowl-hci');

let barnowl = new BarnowlHci();

barnowl.addListener(BarnowlHci.TestListener, {});

barnowl.on("raddec", function(raddec) {
  console.log(raddec);
});

barnowl.on("infrastructureMessage", function(message) {
  console.log(message);
});
```

As output you should see a stream of [raddec](https://github.com/reelyactive/raddec/) objects similar to the following:

```javascript
{
  transmitterId: "001122334455",
  transmitterIdType: 2,
  rssiSignature: [
    {
      receiverId: "000000000000",
      receiverIdType: 2,
      rssi: -69,
      numberOfDecodings: 1
    }
  ],
  packets: [ '421655daba50e1fe0201050c097265656c79416374697665' ],
  timestamp: 1547693457133
}
```

Regardless of the underlying RF protocol and hardware, the [raddec](https://github.com/reelyactive/raddec/) specifies _what_ (transmitterId) is _where_ (receiverId & rssi), as well as _how_ (packets) and _when_ (timestamp).


Is that owl you can do?
-----------------------

While __barnowl-hci__ may suffice standalone for simple real-time applications, its functionality can be greatly extended with the following software packages:
- [advlib](https://github.com/reelyactive/advlib) to decode the individual packets from hexadecimal strings into JSON
- [barnowl](https://github.com/reelyactive/barnowl) to combine parallel streams of RF decoding data in a technology-and-vendor-agnostic way

These packages and more are bundled together as the [Pareto Anywhere](https://www.reelyactive.com/pareto/anywhere) open source middleware suite, which includes several __barnowl-x__ listeners.


Supported Listener Interfaces
-----------------------------

The following listener interfaces are supported.

### Socket

Listen on a local Bluetooth HCI interface.  Check the [bluetooth-hci-socket](https://www.npmjs.com/package/@abandonware/bluetooth-hci-socket) package for prerequisites specific to the target platform.  Note that not all platforms are supported.  It may be required to grant additional user privileges, or else run as super user (at your own risk).

```javascript
barnowl.addListener(BarnowlHci.SocketListener, {});
```

### Test

Provides a steady stream of simulated reel packets for testing purposes.

```javascript
barnowl.addListener(BarnowlHci.TestListener, {});
```


Pareto Anywhere Integration
---------------------------

__barnowl-hci__ includes a script to forward data to a local [Pareto Anywhere](https://www.reelyactive.com/pareto/anywhere/) instance as UDP raddecs with target localhost:50001.  Start this script with the command:

    npm run forwarder

See our [Run Pareto Anywhere on a Raspberry Pi](https://reelyactive.github.io/diy/pareto-anywhere-pi/#step02) and [Run Pareto Anywhere on a PC](https://reelyactive.github.io/diy/pareto-anywhere-pc/#step02) tutorials for instructions on how to run __barnowl-hci__ as a systemd service on boot on a Raspberry Pi or PC, respectively.


Assigning Privileges
--------------------

To start a scan _without_ root privileges, it is necessary to grant __cap_net_raw__ privileges.  For instance, to grant privileges to Node.js so that _any_ Linux user may start a scan, run the following:

    sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)


Installation Requirements
-------------------------

__barnowl-hci__ depends on the [bluetooth-hci-socket](https://www.npmjs.com/package/@abandonware/bluetooth-hci-socket) package which does not support all operating systems.  If your OS _is_ supported but a precompiled binary does not exist, npm will attempt to compile the binary using [node-gyp](https://www.npmjs.com/package/node-gyp) (which may require installation).

On Ubuntu/Debian Linux distributions, if node-gyp throws errors during installation, the _make_ and _g++_ prerequisites for compilation may need to first be installed as follows:
- sudo apt install make
- sudo apt install build-essential


Contributing
------------

Discover [how to contribute](CONTRIBUTING.md) to this open source project which upholds a standard [code of conduct](CODE_OF_CONDUCT.md).


Security
--------

Consult our [security policy](SECURITY.md) for best practices using this open source software and to report vulnerabilities.

[![Known Vulnerabilities](https://snyk.io/test/github/reelyactive/barnowl-hci/badge.svg)](https://snyk.io/test/github/reelyactive/barnowl-hci)


License
-------

MIT License

Copyright (c) 2018-2022 [reelyActive](https://www.reelyactive.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.
