import {checkOpen} from '../utils/common.js'
export const rule = {
    //帮助说明
    help: {
        reg: "^#*(命令|帮助|菜单|help|说明|功能|指令|使用说明)$",
        priority: 500,
    },
}

export async function help(e) {
    if (e.at && !e.atBot) {
        return;
    }
    let msg = [
        '欢迎使用雨轩机器人\r\n',
    ]
    let index = 0
    for (const item in YuxuanApps) {
        if (YuxuanApps[item]['rule']) {
            let rules = YuxuanApps[item]['rule']
            for (const rule in rules) {
                if (rules[rule]['describe']) {
                    let open = e.isGroup ? checkOpen(item, rule, e.group_id) : true
                    msg.push((++index) + '. [' + (open ? '可用' : '禁用') + '] -' + rules[rule]['describe'] + '\r\n')
                }
            }
        }
    }

    e.reply(msg)
}
// 推送广告
export function PushAD(){
    let adMsg = ['雨轩机器人温馨提示：']
    adMsg.push('收死亡产出，收盒子，收打捞件，收挖坟产出，收行星产物，收矿，收深渊产出出各种舰船，各种装备，各种船插，各种弹药。可直接0价挂给Yama5')
    adMsg.push('\n\n')
    adMsg.push('https://www.yuxuan66.com/s/yuxuanbuy')
    BotConfig.app.eve.adGroup.forEach(item=>{
        Bot.pickGroup(item).sendMsg(adMsg).catch((err) => {
            Bot.logger.mark(err);
        });
    })
}
export function PushWelcome(){
    BotConfig.app.eve.adGroup.forEach(v=>{
        Bot.pickGroup(v).sendMsg('雨轩机器人维护完成。感谢您的支持').catch((err) => {
            Bot.logger.mark(err);
        });
    })
}
// 随机插入广告
export function checkMsg(msg) {
    if (Array.isArray(msg) && msg.length === 1) {
        //msg.push(`YuxuanBot为您服务`);
    }
    return msg
}
