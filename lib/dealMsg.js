import {render, getPluginRender} from './utils/render.js'
import * as Components from './components/index.js'
import {checkOpen} from "./utils/common.js";
import {segment} from "oicq";

/**
 * 处理群聊私聊消息
 */
async function dealMsg(e) {
    if (!isInit) return

    let tmpCommand = {}
    //黑名单
    if (BotConfig.blackQQ && BotConfig.blackQQ.includes(Number(e.user_id))) {
        return
    }

    //没有群昵称的用qq昵称代替
    if (!e.sender.card) {
        e.sender.card = e.sender.nickname
    }

    //主人qq
    if (BotConfig.masterQQ && BotConfig.masterQQ.includes(Number(e.user_id))) {
        e.isMaster = true
    }

    if (e.user_id === BotConfig.account.qq) {
        return
    }
    if (e.isGroup) {
        //黑名单群
        if (BotConfig.blackGroup && BotConfig.blackGroup.includes(Number(e.group_id))) {
            return
        }
        //禁言中
        if (e.group.mute_left > 0) {
            return
        }
        e.logText = `[${e.group_name}(${e.sender.card})]`
    } else {
        e.group_name = '私聊'
        e.logText = `[私聊][${e.sender.nickname}(${e.user_id})]`
    }

    tmpCommand = command

    //重写reply方法，捕获发送消息失败异常
    e.replyNew = e.reply
    e.reply = (msg, quote = false) => {
        redis.incr(`Yuxuan:sendMsgNum:${BotConfig.account.qq}`)
        return e.replyNew(msg, quote).catch((err) => {
            Bot.logger.mark(err)
        })
    }

    //处理消息
    for (let val of e.message) {
        switch (val.type) {
            case 'text':
                val.text = val.text.replace(/＃|井/g, '#').trim()
                if (e.msg) {
                    e.msg += val.text
                } else {
                    e.msg = val.text
                }
                break
            case 'image':
                if (!e.img) {
                    e.img = []
                }
                e.img.push(val.url)
                break
            case 'at':
                if (val.qq === BotConfig.account.qq) {
                    // 可能不止一个at，只要匹配到就算atBot
                    e.atBot = true
                    e.at = e.at || val.qq
                } else {
                    // atBot的优先级比其他的优先级低，尽量保留对其他人的at
                    e.at = val.qq
                }
                break
            case 'file':
                e.file = {name: val.name, fid: val.fid}
                break
        }
    }

    //回复消息
    if (e.source) {
        e.hasReply = true
    }

    if (typeof YuxuanApps == 'undefined') {
        return
    }

    for (let val of tmpCommand) {
        if(val.groupRequest){
            continue
        }
        let msg = e.msg


        if (!val.reg) {
            val.reg = 'noCheck'
        }

        if (new RegExp(val.reg).test(msg) || val.reg === 'noCheck') {
            let log = `${e.logText} ${msg}:${val.name}`

            if (val.reg === 'noCheck' ) {
                // Bot.logger.debug(log)
            } else {
                Bot.logger.mark(log)
            }

            let {type, name, _plugin} = val

            if (_plugin) {
                type = 'plugin_' + type
            }
            // 判断插件是否允许使用
            if (!YuxuanApps[type] || !YuxuanApps[type][name]) {
                Bot.logger.error(`请先export该方法：${type}.${name}`)
                return
            }
            let app = BotAllow[type]
            if (!app) {
                Bot.logger.error(`没有找到此功能的管理权限`)
                return
            }
            let nameApp = app[name]
            if (!nameApp) {
                // 没有找到这个配置，使用默认配置
                nameApp = app['default']
                if (!nameApp) {
                    Bot.logger.error(`没有找到此功能的管理权限`)
                    return
                }
            }
            if ((nameApp.length === 1 && nameApp[0] === -1) || (nameApp.length !== 0 && nameApp.indexOf(e.group_id) === -1)) {
                //e.reply(BotConfig.notAllow)
                return
            }

            try {
                await YuxuanApps[type][name](e, {
                    render: _plugin ? getPluginRender(_plugin) : render,
                    ...Components
                })
            } catch (error) {
                Bot.logger.error(`${type}.${name}`)
                Bot.logger.error(decodeURI(error.stack))
                break
            }
        }
    }
}


/**
 * 群消息通知，戳一戳，新人加入，禁言
 */
async function dealGroupNotice(e) {
    //黑名单群
    if (BotConfig.blackGroup && BotConfig.blackGroup.includes(Number(e.group_id))) {
        return
    }

}


/**
 * 好友请求通知，默认自动同意
 */
function dealFriend(e) {
    if (e.sub_type === 'add' || e.sub_type === 'single') {
        Bot.logger.mark(`添加好友：${e.user_id}`)
        //自动同意添加好友
        if (typeof BotConfig.account.autoFriend == 'undefined' || BotConfig.account.autoFriend === 1) {
            e.approve(true)
        }
    }
}

/**
 * 群请求通知，邀请加群
 * 主人邀请自动同意
 */
function dealGroupRequest(e) {
    if (e.sub_type === 'invite') {
        if (!BotConfig.masterQQ || !BotConfig.masterQQ.includes(Number(e.user_id))) {
            Bot.logger.mark(`邀请加群：${e.group_name}：${e.group_id}`)
            return
        }
        Bot.logger.mark(`主人邀请加群：${e.group_name}：${e.group_id}`)
        e.approve(true).then(r => {
        })
        Bot.sendPrivateMsg(e.user_id, `已同意加群：${e.group_name}`).catch((err) => {
            Bot.logger.error(err)
        })
    } else if (e.sub_type === 'add') {
        if (BotConfig.masterQQ.includes(Number(e.user_id))) {
            e.approve(true).then(r => {
            })
        } else {
            // 加群校验设计
            for (let val of command) {
                let {type, name, groupRequest} = val

                val.reg = val.reg || 'noCheck'

                if (val.reg !== 'noCheck' || !groupRequest) {
                    continue
                }


                if (!YuxuanApps[type] || !YuxuanApps[type][name]) {
                    Bot.logger.error(`请先导出该方法：${type}.${name}`)
                    continue
                }
                // 判断插件是否允许使用
                if (checkOpen(type, name, e.group_id)) {
                    YuxuanApps[type][name](e,{...Components})
                }
            }
        }
    }
}

/**
 * 禁言
 */
function dealBan(e) {
}

/**
 * 新人加入
 */
async function dealIncrease(e) {

    if (e.user_id === BotConfig.account.qq) {
        let gl = await e.group.getMemberMap()
        let hasMaster = false
        for (let qq of BotConfig.masterQQ) {
            if (gl.has(qq)) {
                hasMaster = true
                break
            }
        }
        if (Array.from(gl).length <= 50 && !hasMaster && BotConfig.account?.autoQuit === 1) {
            e.group.quit()
        }
        return
    }


}

export default {dealMsg, dealGroupNotice, dealFriend, dealGroupRequest}
