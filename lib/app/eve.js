import {render} from '../utils/render.js';
import {segment} from 'oicq';
import common from '../utils/common.js'
import {translate} from "../utils/cacx.js";

export const rule = {
    //帮助说明
    price: {
        reg: '^(jita|.jita|ojita|.ojita|gjita|.gjita|col|.col|gcol|.gcol)(.*)$',
        priority: 500,
        describe: 'EVE查询-价格查询指令：\n- jita xxx|gjita xxx\n- col 高级水晶|gcol 高级水晶',
    },
    industrySystems: {
        reg: '^(系数|工业系数|工业指数)(.*)$',
        priority: 501,
        describe: 'EVE查询-工业系数查询指令：(系数 4-HWWF)'
    },
    trans:{
        reg: '^(翻译|tr|.tr|.trans|trans)(.*)$',
        priority: 502,
        describe: 'EVE查询-物品翻译指令：(tr 毒蜥级)'
    }
}

/**
 * 获取物品翻译
 * @param e
 * @param Models
 * @returns {Promise<boolean>}
 */
export async function trans(e,{Models}){
    let checkRet = /^(翻译|tr|.tr|.trans|trans)(.*)$/.exec(e.msg || '')

    if (!checkRet || !checkRet[2]) {
        e.reply(`请输入【tr 毒蜥级】，进行翻译`)
        return false
    }
    const name = checkRet[2].trim()
    let trJson = await translate(name)
    e.reply(trJson['data'])
    return false
}

/**
 * 查询指定星座系数
 * @param e 消息发送人
 * @param Models
 * @returns {Promise<boolean>}
 */
export async function industrySystems(e, {Models}) {
    let {EveService} = Models

    let checkRet = /^(系数|工业系数|工业指数)(.*)$/.exec(e.msg || '')

    if (!checkRet || !checkRet[2]) {
        e.reply(`请输入【系数 4-HWWF】，进行查询`)
        return false
    }

    const name = checkRet[2].trim()
    e.reply('开始为您查询星系【' + name + '】的工业系数')

    const systemData = await EveService.getIndustrySystems(name)

    if (!systemData) {
        e.reply('无法找到您查询的星系【' + name + '】')
        return false
    }
    let sendMsg = []
    sendMsg.push("您查询的星系【" + name + "】：")
    sendMsg.push('\n制造系数：')
    sendMsg.push(systemData['manufacturing'].toFixed(2).toString())

    sendMsg.push('\n时间优化系数：')
    sendMsg.push(systemData['researching_time_efficiency'].toFixed(2).toString())

    sendMsg.push('\n材料优化系数：')
    sendMsg.push(systemData['researching_material_efficiency'].toFixed(2).toString())

    sendMsg.push('\n复制系数：')
    sendMsg.push(systemData['copying'].toFixed(2).toString())

    sendMsg.push('\n发明系数：')
    sendMsg.push(systemData['invention'].toFixed(2).toString())

    sendMsg.push('\n反应系数：')
    sendMsg.push(systemData['reaction'].toFixed(2).toString())

    e.reply(sendMsg)

    return false

}

/**
 * 查询EVE市场价格
 * @param e 消息发送人
 * @param Models
 * @returns {Promise<boolean>}
 */
export async function price(e, {Models}) {

    let {EveService} = Models

    let checkRet = /^(jita|.jita|ojita|.ojita|gjita|.gjita|col|.col|gcol|.gcol)(.*)$/.exec(e.msg || '')

    let isEur = e.msg.indexOf('gjita') === -1 && e.msg.indexOf('gcol') === -1

    if (!checkRet || !checkRet[2]) {
        e.reply(`请输入【jita 毒蜥级】，进行查询`)
        return false;
    }

    let priceJson = await EveService.getPrice(isEur, checkRet[2].trim())
    if (priceJson.length === 0) {
        e.reply('听不懂您在说什么呢！')
        return false;
    }
    if (priceJson.length === 1) {

        // 获取30天内综合成交价
        const history = priceJson[0]['history']
        let before = new Date(new Date() - 1000 * 60 * 60 * 24 * 30)
        let day = 0
        let sell = 0
        let buy = 0
        for (const item of history) {
            if (new Date(item['date']) > before) {
                day++
                sell += item['highest']
                buy += item['lowest']
            }
        }
        priceJson[0]['sell30'] = (sell / day).toFixed(2)
        priceJson[0]['buy30'] = (buy / day).toFixed(2)

        priceJson[0]['buyScale'] = (100 - priceJson[0]['buy'] / priceJson[0]['buy30'] * 100).toFixed(2)
        priceJson[0]['sellScale'] = (100 - priceJson[0]['sell'] / priceJson[0]['sell30'] * 100).toFixed(2)

        priceJson[0]['split500'] = common.toThousands(((priceJson[0]['buy'] + priceJson[0]['sell']) / 2 * 500).toFixed(2))
        priceJson[0]['sell500'] = common.toThousands((priceJson[0]['sell'] * 500).toString())
        priceJson[0]['buy500'] = common.toThousands((priceJson[0]['buy'] * 500).toString())

        priceJson[0]['split'] = common.toThousands(((priceJson[0]['buy'] + priceJson[0]['sell']) / 2).toFixed(2))
        priceJson[0]['buy'] = common.toThousands(priceJson[0]['buy'])
        priceJson[0]['sell'] = common.toThousands(priceJson[0]['sell'])

        priceJson[0]['buy30'] = common.toThousands(priceJson[0]['buy30'])
        priceJson[0]['sell30'] = common.toThousands(priceJson[0]['sell30'])

        priceJson[0]['server'] = isEur ? '欧服' : '国服'
        let priceImg = await render('eve', 'price', priceJson[0]);

        let sendMsg = []

        sendMsg.push(segment.image(`base64://${priceImg}`))
        sendMsg.push('\n')
        sendMsg.push(priceJson[0]['typeName'])
        sendMsg.push('\n收单：')
        sendMsg.push(priceJson[0]['buy'])
        sendMsg.push(' ISK\n卖单：')
        sendMsg.push(priceJson[0]['sell'])
        sendMsg.push(' ISK\n=============\n')

        e.reply(sendMsg)
        return false;
    }
    let sendMsg = []
    let allSell = 0
    let allBuy = 0
    for (const item of priceJson) {
        sendMsg.push(item['typeName'])
        sendMsg.push('\n收单：')
        sendMsg.push(common.toThousands(item['buy']))
        sendMsg.push(' ISK\n卖单：')
        sendMsg.push(common.toThousands(item['sell']))
        sendMsg.push(' ISK\n=============\n')
        allSell += item['sell']
        allBuy += item['buy']
    }
    if(checkRet[1].indexOf('col') !== -1){
        sendMsg.push(`全套收单：${common.toThousands(allBuy)} ISK\n`)
        sendMsg.push(`全套卖单：${common.toThousands(allSell)} ISK\n`)
    }

    e.reply(sendMsg)
    return false
}