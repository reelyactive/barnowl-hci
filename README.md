barnowl-hci
===========

Interface the Bluetooth Host Controller Interface to [barnowl](https://github.com/reelyactive/barnowl) open source software.  We believe in an open Internet of Things.


Installation
------------

    npm install barnowl-hci


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

See our [Run Pareto Anywhere on a Raspberry Pi](https://reelyactive.github.io/diy/pareto-anywhere-pi/#step02) tutorial for instructions on how to run __barnowl-hci__ on a Raspberry Pi as a systemd service on boot.


Assigning Privileges
--------------------

To start a scan _without_ root privileges, it is necessary to grant __cap_net_raw__ privileges.  For instance, to grant privileges to Node.js so that _any_ Linux user may start a scan, run the following:

    sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)


License
-------

MIT License

Copyright (c) 2018-2021 [reelyActive](https://www.reelyactive.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.
