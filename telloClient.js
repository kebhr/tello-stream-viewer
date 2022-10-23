const dgram = require('dgram');
const fs = require('fs');

class TelloClient {
    constructor() {
        this.sps = Buffer.alloc(0);
        this.pps = Buffer.alloc(0);
        this.idr = Buffer.alloc(0);
        this.pfr = Buffer.alloc(0);

        this.connect();
    }

    connect() {
        this.commandServer = dgram.createSocket('udp4');
        this.commandServer.bind(8890);

        this.videoServer = dgram.createSocket('udp4');
        this.videoServer.on('message', (msg, rinfo) => {
            if (this.isSps(msg)) {
                console.log(new Date() + ' : SPS');
                this.sps = msg;
                this.makeImage();
            } else if (this.isPps(msg)) {
                console.log(new Date() + ' : PPS');
                this.pps = msg;
            } else if (this.isIdr(msg)) {
                console.log(new Date() + ' : IDR');
                this.idr = msg;
            } else if (this.isPfr(msg)) {
                // console.log(new Date() + ' : P');
                this.pfr = Buffer.concat([this.pfr, msg]);
            } else {
                // console.log(new Date() + ' : Payload')
                this.pfr = Buffer.concat([this.pfr, msg]);
            }
        });
        this.videoServer.bind(11111);

        this.commandServer.send('command', 8889, '192.168.10.1');

        setTimeout(() => this.commandServer.send('streamon', 8889, '192.168.10.1'), 1000);

    }

    isSps(msg) {
        if (msg.byteLength < 5) return false;
        return msg.compare(Buffer.from([0, 0, 0, 1, 103]), 0, 5, 0, 5) === 0;
    }

    isPps(msg) {
        if (msg.byteLength < 5) return false;
        return msg.compare(Buffer.from([0, 0, 0, 1, 104]), 0, 5, 0, 5) === 0;
    }

    isIdr(msg) {
        if (msg.byteLength < 5) return false;
        return msg.compare(Buffer.from([0, 0, 0, 1, 101]), 0, 5, 0, 5) === 0;
    }

    isPfr(msg) {
        if (msg.byteLength < 5) return false;
        return msg.compare(Buffer.from([0, 0, 0, 1, 65]), 0, 5, 0, 5) === 0;
    }

    makeImage() {
        const rawVideo = Buffer.concat([this.sps, this.pps, this.idr, this.pfr]);
        console.log(rawVideo);

        fs.writeFile(Date.now() + '.h264', rawVideo, () => {});
        
        this.sps = Buffer.alloc(0);
        this.pps = Buffer.alloc(0);
        this.idr = Buffer.alloc(0);
        this.pfr = Buffer.alloc(0);
    }
};

module.exports = TelloClient;