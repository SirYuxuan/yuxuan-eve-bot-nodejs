import {render} from '../utils/render.js';
import {segment} from 'oicq';
import common from '../utils/common.js'

export const rule = {
    //帮助说明
    price: {
        reg: '^(jita|.jita|ojita|.ojita|gjita|.gjita)(.*)$',
        priority: 500,
        describe: 'EVE查询-价格查询：指令：(jita xxx|gjita xxx)',
    },
    industrySystems: {
        reg: '^(系数|工业系数|工业指数)(.*)$',
        priority: 501,
        describe: 'EVE查询-工业系数查询：指令：(系数 4-HWWF)'
    }
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
    sendMsg.push('\r\n制造系数：')
    sendMsg.push(systemData['manufacturing'].toFixed(2).toString())

    sendMsg.push('\r\n时间优化系数：')
    sendMsg.push(systemData['researching_time_efficiency'].toFixed(2).toString())

    sendMsg.push('\r\n材料优化系数：')
    sendMsg.push(systemData['researching_material_efficiency'].toFixed(2).toString())

    sendMsg.push('\r\n复制系数：')
    sendMsg.push(systemData['copying'].toFixed(2).toString())

    sendMsg.push('\r\n发明系数：')
    sendMsg.push(systemData['invention'].toFixed(2).toString())

    sendMsg.push('\r\n反应系数：')
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

    let checkRet = /^(jita|.jita|ojita|.ojita|gjita|.gjita)(.*)$/.exec(e.msg || '')

    let isEur = e.msg.indexOf('gjita') === -1

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

        priceJson[0]['sell500'] = common.toThousands((priceJson[0]['sell'] * 500).toString())
        priceJson[0]['buy500'] = common.toThousands((priceJson[0]['buy'] * 500).toString())

        priceJson[0]['buy'] = common.toThousands(priceJson[0]['buy'])
        priceJson[0]['sell'] = common.toThousands(priceJson[0]['sell'])

        priceJson[0]['buy30'] = common.toThousands(priceJson[0]['buy30'])
        priceJson[0]['sell30'] = common.toThousands(priceJson[0]['sell30'])

        priceJson[0]['server'] = isEur ? '欧服' : '国服'
        let priceImg = await render('eve', 'price', priceJson[0]);
        e.reply(segment.image(`base64://${priceImg}`))
        return false;
    }
    let sendMsg = []
    for (const item of priceJson) {
        sendMsg.push(item['typeName'])
        sendMsg.push('\r\n收单：')
        sendMsg.push(common.toThousands(item['buy']))
        sendMsg.push(' ISK\r\n卖单：')
        sendMsg.push(common.toThousands(item['sell']))
        sendMsg.push(' ISK\r\n=============\r\n')
    }

    e.reply(sendMsg)
    return false
}