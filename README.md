barnowl-hci
===========

__barnowl-hci__ converts the decodings of _any_ ambient Bluetooth Low Energy devices from a local Bluetooth Host Controller Interface (HCI) into standard developer-friendly JSON that is vendor/technology/application-agnostic.

![Overview of barnowl-hci](https://reelyactive.github.io/barnowl-hci/images/overview.png)

__barnowl-hci__ is a lightweight [Node.js package](https://www.npmjs.com/package/barnowl-hci) that can run on resource-constrained edge devices.  It can [forward data](#pareto-anywhere-integration) to reelyActive's [Pareto Anywhere](https://www.reelyactive.com/pareto/anywhere/) open source middleware suite, and can just as easily be run standalone behind a [barnowl](https://github.com/reelyactive/barnowl) instance, as detailed in the code examples below.


Quick Start
-----------

Clone this repository and install package dependencies with `npm install`.  If installation fails on your system, validate [these installation requirements](#installation-requirements).

Then from the root folder run at any time:

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

Listen on a local Bluetooth HCI interface.  Check the [bluetooth-hci-socket](https://www.npmjs.com/package/@stoprocent/bluetooth-hci-socket) package for prerequisites specific to the target platform.  Note that not all platforms are supported.  It may be required to grant additional user privileges, or else run as super user (at your own risk).

```javascript
let options = { deviceId: null, // null = any, 0 = hci0, 1 = hci1, etc...
                enableActiveScanning: false,
                scanIntervalMilliseconds: 10,
                scanWindowMilliseconds: 10,
                kickIntervalMilliseconds: 1000 };
barnowl.addListener(BarnowlHci.SocketListener, options);
```

The default options are shown above.  Note that, according to the Bluetooth Core Specification:
- valid interval & window durations are in the range of 2.5ms to 10.24s
- the window duration cannot exceed the interval duration

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

To instead forward UDP raddecs to a _remote_ Pareto Anywhere instance, start this script with the command:

    npm run forwarder xxx.xxx.xxx.xxx

where xxx.xxx.xxx.xxx is the IP address of the remote instance.


Assigning Privileges
--------------------

If required, assign the necessary privileges for Node.js to initiate a HCI scan on the given OS with the command:

    npm run privileges

On Linux systems (such as the Raspberry Pi) this will run the following command to grant __cap_net_raw__ privileges so that _any_ Linux user may start a scan.

    sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)


Installation Requirements
-------------------------

__barnowl-hci__ depends on the [bluetooth-hci-socket](https://www.npmjs.com/package/@stoprocent/bluetooth-hci-socket) package which _does not_ support all operating systems.  If your OS _is_ supported but a precompiled binary does not exist, npm will attempt to compile the binary using [node-gyp](https://www.npmjs.com/package/node-gyp) (which may need to be installed).

On Ubuntu/Debian Linux distributions, if node-gyp throws errors during installation, the _make_ and _g++_ prerequisites for compilation may need to first be installed with `sudo apt install make` and `sudo apt install build-essential` respectively.


Project History
---------------

__barnowl-hci__ is based on the __bluetooth-hci-socket__ package which has been forked and maintained by various members of the open source community since 2015.  The initial versions of __barnowl-hci__ were based on Sandeep Mistry's original [bluetooth-hci-socket](https://www.npmjs.com/package/bluetooth-hci-socket).  The [@abandonware/bluetooth-hci-socket](https://www.npmjs.com/package/@abandonware/bluetooth-hci-socket) fork, which was adopted in 2019, can be found in the [release-0.3 branch](https://github.com/reelyactive/barnowl-hci/tree/release-0.3/).  And the [@stoprocent/bluetooth-hci-socket](https://www.npmjs.com/package/@stoprocent/bluetooth-hci-socket) fork, actively maintained at the time of writing, is currently used.


Acknowledgements
----------------

__barnowl-hci__ is based on the [@stoprocent/bluetooth-hci-socket](https://www.npmjs.com/package/@stoprocent/bluetooth-hci-socket) open source Node.js package whose maintainer we invite you to consider supporting at [buymeacoffee.com/stoprocent](https://www.buymeacoffee.com/stoprocent).


Contributing
------------

Discover [how to contribute](CONTRIBUTING.md) to this open source project which upholds a standard [code of conduct](CODE_OF_CONDUCT.md).


Security
--------

Consult our [security policy](SECURITY.md) for best practices using this open source software and to report vulnerabilities.


License
-------

MIT License

Copyright (c) 2018-2025 [reelyActive](https://www.reelyactive.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.
