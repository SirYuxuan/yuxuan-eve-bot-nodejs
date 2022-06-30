import {render} from "../utils/render.js";
import {segment} from "oicq";
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
    checkJoin: {
        reg: 'noCheck',
        groupRequest: true
    }
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

/**
 * 查询个人信息
 * @param e 发送信息
 * @param Models
 * @returns {Promise<boolean>}
 */
export async function info(e, {Models}) {

    let infoData = await get(BotConfig.app.corp.path + 'api/info', {qq: e.sender.user_id})
    if (infoData['code'] === 200) {
        let infoImage = await render('corp', 'info', infoData['data']);
        e.reply(segment.image(`base64://${infoImage}`))

        return false
    }
    e.reply(infoData['msg'])
    return false

}

export async function rat(e, {Models}) {
    e.reply('功能暂停使用中')
    return false
}

export async function pap(e, {Models}) {
    e.reply('功能暂停使用中')
    return false
}