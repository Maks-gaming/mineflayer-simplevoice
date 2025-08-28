<h1 align="center">mineflayer-simplevoice</h1>
<p align="center"><i>A lightweight plugin for Mineflayer that allows use VoiceChat for Simple Voice Chat mod</i></p>

# Features
- 🔥 Supports **CommonJS** and **ES6**
- 🔈 Allows to send any soundfile formats using **FFMPEG**
- 🔒 Works with **AES-128-CBC** Encryption
- 👀 Almost exactly mimics the behavior of the original mod
- 🖧 Using java-like buffers to assemble the packets`

# Getting Started
#### Installation
1) This plugin is built using Node and can be installed using: ```npm install mineflayer-simplevoice --save```

#### Simple Sound Player
A bot that sneaks will play a certain sound (/path/to/music.mp3) and get up.
```js
const mineflayer = require("mineflayer")
const simplevoice = require("mineflayer-simplevoice")

const bot = mineflayer.createBot({
    "host": "localhost"
})

bot.loadPlugin(simplevoice.plugin)

bot.on("voicechat_connected", () => {
    bot.setControlState("sneak", true)
})
```

#### Debugging
```js
const simplevoice = require("mineflayer-simplevoice")

/** By default - 4, and these are warnings, errors and fatal errors */
simplevoice.setLoggingLevel(0)
```

#### Listening players
> An example of an event when some player is talking
- Data format is `pcm_s16le`
- Sequence number goes in order from zero, some packet **may be skipped** when using the UDP protocol
```js
bot.on("voicechat_player_sound", (data) => {
    /*{
        channelId: string;
        sender?: string;
        data: Buffer;
        sequenceNumber: BigInt;
        distance: number;
        whispering: boolean;
        category?: string;
    }*/
})
```

---

# License
This project uses the [MIT](https://github.com/Maks-gaming/mineflayer-voicechat/blob/master/LICENSE) license.


> This project is accepting PRs and Issues. See something you think can be improved? Go for it! Any and all help is highly appreciated!

> For larger changes, it is recommended to discuss these changes in the issues tab before writing any code. It's also preferred to make many smaller PRs than one large one, where applicable.
