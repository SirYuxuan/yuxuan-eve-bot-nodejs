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
                    let open = e.isGroup ? await checkOpen(item, rule, e.group_id) : true
                    msg.push((++index) + '. [' + (open ? '可用' : '禁用') + '] -' + rules[rule]['describe'] + '\r\n')
                }
            }
        }
    }

    e.reply(msg)
}

// 随机插入广告
export function checkMsg(msg) {
    if (Array.isArray(msg) && msg.length === 1) {
        //msg.push(`YuxuanBot为您服务`);
    }
    return msg
}
