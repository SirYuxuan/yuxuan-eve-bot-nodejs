import {createClient} from 'redis'
import fs from 'fs'
import lodash from 'lodash'
import log4js from 'log4js'
import common from './utils/common.js'
import schedule from "node-schedule";
import {PushWelcome} from "./app/help.js";
//设置时区
process.env.TZ = 'Asia/Shanghai'
const _path = process.cwd()
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

global.isInit = false


export async function init() {
    if (isInit) {
        return
    }

    //初始化redis
    await initRedis()

    //初始化功能
    await loadApp(['app'])
    await loadPlugin(['plugins'])

    Bot.logger.mark(`Yuxuan-Bot 上线成功 版本v${packageJson.version}`)

    //重写log
    Bot.logger = await log()

    //定时任务
    await task()

    //配置config热加载
    await hotLoad()

    // 热加载功能使用权
    await hotAllow()

    //功能热加载
    await hotLoadApp(['app'])

    //首次登录推送消息
    await firstLogin()

    //初始化完成
    global.isInit = true



}

// 定时任务
async function task() {
    // 定时广告推送
    schedule.scheduleJob("0 25 19 1/1 * ? ", () => YuxuanApps.help.PushAD());
}

//首次登录提示
async function firstLogin() {

    if (!BotConfig.masterQQ || BotConfig.masterQQ.length <= 0) {
        return
    }

  /*  if (await redis.get(`Yuxuan:loginMsg:${BotConfig.account.qq}`)) {
        return
    }*/

    let msg = `欢迎使用【Yuxuan-Bot v${packageJson.version}】\n`
    let key = `Yuxuan:loginMsg:${BotConfig.account.qq}`

    await redis.set(key, '1', {EX: 3600 * 24})

    setTimeout(() => {
        common.replyPrivate(BotConfig.masterQQ[0], msg)
    }, 1000)

    // 推送一次广告
    YuxuanApps.help.PushWelcome()
}

let fsTimeout = {}

// 功能白名单热加载
async function hotAllow() {
    fs.watch('./config/allow.js', async (event, filename) => {
        if (fsTimeout.allow) {
            return
        }
        fsTimeout.allow = true

        setTimeout(async () => {
            let allow
            try {
                allow = (await import(`../config/allow.js?version=${new Date().getTime()}`)).allow
            } catch (err) {
                Bot.logger.error(`配置报错：allow.js\n${err}`)
                fsTimeout.config = null
                return
            }

            for (let k in global.BotAllow) {
                if (lodash.isUndefined(allow[k])) {
                    delete global.BotAllow[k]
                }
            }

            for (let k in allow) {
                global.BotAllow[k] = allow[k]
            }
            Bot.logger.mark('更新配置allow成功')
            fsTimeout.config = null
        }, 500)
    })
}

// config热更新
async function hotLoad() {
    fs.watch('./config/config.js', async (event, filename) => {
        if (fsTimeout.config) {
            return
        }
        fsTimeout.config = true

        setTimeout(async () => {
            let config
            try {
                config = (await import(`../config/config.js?version=${new Date().getTime()}`)).config
            } catch (err) {
                Bot.logger.error(`配置报错：config.js\n${err}`)
                fsTimeout.config = null
                return
            }

            for (let k in global.BotConfig) {
                if (lodash.isUndefined(config[k])) {
                    delete global.BotConfig[k]
                }
            }

            for (let k in config) {
                global.BotConfig[k] = config[k]
            }


            Bot.logger.mark('更新配置config成功')
            fsTimeout.config = null
        }, 500)
    })
}

// app热更新
async function hotLoadApp(dir) {
    for (let val of dir) {
        fs.watch(`./lib/${val}`, async (event, filename) => {
            let re = new RegExp(`.js$`, 'i')
            if (fsTimeout[val] || !re.test(filename)) {
                return
            }
            fsTimeout[val] = true

            let type = filename.replace('.js', '')

            setTimeout(async () => {
                if (!fs.existsSync(`./lib/${val}/${filename}`)) {
                    fsTimeout[val] = null
                    return
                }
                let tmp
                try {
                    tmp = await import(`./${val}/${filename}?version=${new Date().getTime()}`)
                } catch (err) {
                    Bot.logger.error(`报错${val}/${type}.js\n${err}`)
                    fsTimeout[val] = null
                    return
                }
                let rule = tmp.rule
                if (!rule) {
                    fsTimeout[val] = null
                    return
                }
                for (let i in command) {
                    if (type === command[i].type && rule[command[i].name]) {
                        command[i] = {...rule[command[i].name], type: type, name: command[i].name}
                        delete rule[command[i].name]
                    }
                }
                if (Object.keys(rule).length !== 0) {
                    for (let i in rule) {
                        command.push({...rule[i], type: type, name: i})
                    }
                }

                global.command = lodash.orderBy(command, ['priority'], ['asc'])
                YuxuanApps[type] = tmp

                Bot.logger.mark(`更新${val}/${type}.js完成`)
                fsTimeout[val] = null
            }, 500)
        })
    }
}

// 加载功能
async function loadApp(dir) {
    let YuxuanApps = {}
    let command = []
    for (let val of dir) {
        let readDir = fs.readdirSync(_path + `/lib/${val}`)
        readDir = readDir.filter((item) => /.js$/.test(item))

        for (let v of readDir) {
            try {
                let tmp = await import(`./${val}/${v}`)
                if (!tmp.rule) continue
                let type = v.replace('.js', '')
                YuxuanApps[type] = tmp
                for (let i in tmp.rule) {
                    tmp.rule[i].type = type
                    tmp.rule[i].name = i
                    command.push(tmp.rule[i])
                }
            } catch (error) {
                Bot.logger.error(`报错：${v}`)
                console.log(error)
                process.exit()
            }
        }
    }
    command = lodash.orderBy(command, ['priority'], ['asc'])

    global.YuxuanApps = YuxuanApps
    global.command = command
    global.GroupCommand = []

    await saveCommand(command)
}

// 加载Plugin

async function loadPlugin(dir) {
    let YuxuanApps = global.YuxuanApps || {}
    let command = global.command || []

    for (let val of dir) {
        if (!fs.existsSync(_path + `/${val}/`)) {
            fs.mkdirSync(_path + `/${val}/`)
        }
        let readDir = fs.readdirSync(_path + `/${val}/`)
        for (let v of readDir) {
            if (!fs.existsSync(_path + `/${val}/${v}/index.js`)) {
                continue
            }
            try {
                let tmp = await import(`../${val}/${v}/index.js`)
                let rules = tmp.rule
                if (!rules) {
                    continue
                }
                if (typeof rules === 'function') {
                    rules = rule()
                }
                let type = v.replace('.js', '')
                YuxuanApps['plugin_' + type] = tmp
                for (let i in rules) {
                    rules[i].type = type
                    rules[i].name = i
                    rules[i]._plugin = type
                    command.push(tmp.rule[i])
                }
            } catch (error) {
                if (global.debugView) {
                    throw error
                } else {
                    Bot.logger.error(`报错：${v}`)
                    console.log(error)
                }
                process.exit()
            }
        }
    }

    command = lodash.orderBy(command, ['priority'], ['asc'])

    global.YuxuanApps = YuxuanApps
    global.command = command

    await saveCommand(command)
}


//生成命令json
async function saveCommand(command) {
    let data = {
        dec: '命令总览json，只是查看，修改不起作用，需要到具体文件修改',
    }
    for (let val of command) {
        if (!data[val.type]) {
            data[val.type] = {}
        }

        data[val.type][val.name] = {
            reg: val.reg,
            priority: val.priority,
            describe: val.describe,
        }
    }

    fs.writeFileSync('config/command.json', JSON.stringify(data, '', '\t'))
}

//重新配置logger
async function log() {
    log4js.configure({
        appenders: {
            console: {
                type: 'console',
                category: 'console',
                layout: {
                    type: 'pattern',
                    pattern: '[%d{yyyy-MM-ddThh:mm:ss.SSS}] [%[%4.4p%]] %m'
                },
            },
            command: {
                type: 'dateFile', //可以是console,dateFile,file,Logstash等
                filename: 'logs/command', //将会按照filename和pattern拼接文件名
                pattern: 'yyyy-MM-dd.log',
                numBackups: 15,
                alwaysIncludePattern: true,
                layout: {
                    type: 'pattern',
                    pattern: '%d{hh:mm:ss} %m',
                },
            },
            error: {
                type: 'file',
                filename: 'logs/error.log',
                alwaysIncludePattern: true,
            },
        },
        categories: {
            default: {
                appenders: ['console'],
                level: BotConfig.account.logLevel
            },
            command: {
                appenders: ['console', 'command'],
                level: 'warn'
            },
            error: {
                appenders: ['console', 'error'],
                level: 'error'
            },
        },
        pm2: true,
    })

    const defaultLogger = log4js.getLogger('message')
    const commandLogger = log4js.getLogger('command')
    const errorLogger = log4js.getLogger('error')

    return {
        trace() {
            defaultLogger.trace.call(defaultLogger, ...arguments)
        },
        debug() {
            defaultLogger.debug.call(defaultLogger, ...arguments)
        },
        info() {
            defaultLogger.info.call(defaultLogger, ...arguments)
        },
        // warn及以上的日志采用error策略
        warn() {
            commandLogger.warn.call(defaultLogger, ...arguments)
        },
        error() {
            errorLogger.error.call(errorLogger, ...arguments)
        },
        fatal() {
            errorLogger.fatal.call(errorLogger, ...arguments)
        },
        mark() {
            errorLogger.mark.call(commandLogger, ...arguments)
        },
    }
}

//初始化redis
async function initRedis() {
    let redisUrl = ''
    if (BotConfig.redis.password) {
        redisUrl = `redis://:${BotConfig.redis.password}@${BotConfig.redis.host}:${BotConfig.redis.port}`
    } else {
        redisUrl = `redis://${BotConfig.redis.host}:${BotConfig.redis.port}`
    }
    //初始化redis
    const client = createClient({url: redisUrl})

    client.on('error', function (err) {
        if (err === 'Error: connect ECONNREFUSED 127.0.0.1:6379') {
            Bot.logger.error(`请先开启Redis`)
            process.exit()
        } else {
            Bot.logger.error(`redis错误:${err}`)
        }
        process.exit()
    })

    await client.connect()
    await client.select(BotConfig.redis.db)
    global.redis = client
}