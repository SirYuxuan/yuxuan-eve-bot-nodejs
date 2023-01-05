import {get} from "../utils/http.js";
import {checkJoinGroup} from "../utils/cacx.js";

export const rule = {
    //帮助说明
    info: {
        reg: "^info$",
        priority: 500,
        describe: "混沌信息查询-个人信息查询：指令：info",
    },
    rat: {
        reg: "^rat$",
        priority: 500,
        describe: "混沌信息查询-刷新信息查询：指令：rat",
    },
    pap: {
        reg: "^pap$",
        priority: 500,
        describe: "混沌信息查询-PAP信息查询：指令：pap",
    },
    lp: {
        reg: "^lp$",
        priority: 500,
        describe: "混沌信息查询-LP信息查询：指令：lp",
    },
    papRank: {
        reg: '^papRank$',
        priority: 500,
        describe: "军团pap排行榜：指令：papRank",
    },
    checkJoin: {
        reg: 'noCheck',
        groupRequest: true
    }
}

export async function papRank(e, {Models}) {
    try {
        let resultData = await get(BotConfig.app.corp.path + 'api/getSeatOrderPapTracking')
        let data = resultData['data'].data;
        let sendMsg = []
        if (data.length > 0) {
            for (let i = 0; i < 10; i++) {
                let dateItem = data[i];
                let chartName = dateItem.character.split(" />")[1];
                chartName = chartName.substring(0, chartName.length - 1);
                if (i === 0) {
                    sendMsg.push(`混沌pap王: ${chartName},获得了${dateItem.pap_count}个pap`);
                } else {
                    sendMsg.push(`\n第${i + 1}名: ${chartName},获得了${dateItem.pap_count}个pap`);
                }
            }
            e.reply(sendMsg)
        } else {
            e.reply("家人们 服务器指定出了什么问题 没有好果子吃")
        }
    } catch (e) {
        e.reply("家人们 服务器指定出了什么问题 没有好果子吃")
    }

    return false
}

/**
 * 查询个人信息
 * @param e 发送信息
 * @param Models
 * @returns {Promise<boolean>}
 */
export async function info(e, {Models}) {
    let infoData = await get(BotConfig.app.corp.path + 'openAccountApi/info/' + e.sender.user_id)
    if (infoData['code'] === 200) {
        e.reply(infoData['result'])
    } else {
        e.reply(infoData['message'])
    }
    return false

}

export async function rat(e, {Models}) {
    let infoData = await get(BotConfig.app.corp.path + 'openAccountApi/rat/' + e.sender.user_id)
    if (infoData['code'] === 200) {
        e.reply(infoData['result'])
    } else {
        e.reply(infoData['message'])
    }
    return false
}

export async function pap(e, {Models}) {
    let infoData = await get(BotConfig.app.corp.path + 'openAccountApi/pap/' + e.sender.user_id)
    if (infoData['code'] === 200) {
        e.reply(infoData['result'])
    } else {
        e.reply(infoData['message'])
    }
    return false
}

export async function lp(e, {Models}) {
    let infoData = await get(BotConfig.app.corp.path + 'openAccountApi/lp/' + e.sender.user_id)
    if (infoData['code'] === 200) {
        e.reply(infoData['result'])
    } else {
        e.reply(infoData['message'])
    }
    return false
}


/**
 * 加群校验
 * @param e 请求信息
 * @param Models
 * @returns {Promise<void>}
 */
export async function checkJoin(e, {Models}) {
    let joinJson = await checkJoinGroup(e.user_id)
    if (joinJson['code'] === 200) {
        e.approve(true).then(res => {
        })
    } else {
        Bot.setGroupAddRequest(e.flag, false, joinJson['msg'], false).then(res => {
        })
    }
}
