import fs from 'fs'
import readline from 'readline'

if (!fs.existsSync('./node_modules')) {
    console.log('请先npm install安装，或者cnpm install安装')
    process.exit()
}

let configPath = "./config/config.js"
let rl

function question(query) {
    return new Promise((resolve) => {
        if (!rl) {
            return
        }
        rl.question(query.trim(), resolve)
    })
}

async function check(){

    if (fs.existsSync(configPath)) {
        global.BotConfig = (await import(`../config/config.js`)).config
        global.BotAllow = (await import(`../config/allow.js`)).allow

        //默认配置
        if (!global.BotConfig.account.logLevel) {
            global.BotConfig.account.logLevel = 'info'
        }
        if (!global.BotConfig.account.platform) {
            global.BotConfig.account.platform = 5
        }

    }else {
        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        })
        let qq, pwd, platform, masterQQ
        console.log('请按提示输入，生成配置文件config.js，输入错误【Ctrl+c】结束重来')
        qq = await question('请输入机器人QQ号(请用小号)：\n')
        if (!qq) {
            return await check()
        }
        pwd = await question('请输入密码(为空则扫码登录)：\n')
        platform = (await question('1-安卓手机 2-aPad  3-安卓手表 4-MacOS  5-iPad\n请选择登录设备【1-5】：')) || 1

        if (platform && !/^\d+$/.test(platform)) {
            platform = 1
        }
        masterQQ = await question("请输入主人QQ号：")

        let str = fs.readFileSync("./config/config_default.js", "utf8")
        str = str.replace(/qq:(.*)''/, `qq:'${qq}'`)
        str = str.replace(/pwd:(.*)''/, `pwd:'${pwd}'`)
        str = str.replace(/platform:(.*),/, `platform:"${platform}",`)
        str = str.replace(/masterQQ:\[123456,/, `masterQQ: [${masterQQ},`)

        fs.writeFileSync(configPath, str);

        console.log('生成配置文件成功\n其他配置请打开config/config.js修改')
        global.BotConfig = (await import('../config/config.js')).config

        BotConfig.first = true

    }
}

export { check }