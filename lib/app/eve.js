import {render} from '../utils/render.js';
import {segment} from 'oicq';
import {translate} from "../utils/cacx.js";
import {get} from "../utils/http.js";

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
    e.reply(trJson['result'])
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
function isJSON(str) {
    if (typeof str == 'string') {
        try {
            let obj = JSON.parse(str);
            if(typeof obj == 'object' && obj ){
                return true;
            }else{
                return false;
            }

        } catch(e) {
            return false;
        }
    }
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

    let priceJson = await get('https://api.new.hd-eve.com/openBotApi/getPrice/'+isEur+'/'+(checkRet[1].indexOf('col') !== -1)+"/" + checkRet[2].trim())

    let dataJson = priceJson['result']
    if(!isJSON(dataJson)){
        e.reply(dataJson)
        return false;
    }
    dataJson = JSON.parse(dataJson)
    if(!dataJson['history']){
        e.reply(dataJson['msg'])
        return false;
    }
    let history = dataJson['history']

    let sell = 0
    let buy = 0
    for (const item of history['mins']) {
        buy += item
    }
    for (const item of history['maxs']) {
        sell += item
    }

    let imgData = {
        'server':isEur ? '欧服' : '国服',
        'typeId':dataJson['typeId'],
        'typeName':dataJson['typeName'],
        'typeEnName':dataJson['typeEnName'],
        'buy':dataJson['buy'],
        'sell':dataJson['sell'],
        'split':dataJson['split'],
        'buy500':dataJson['buy500'],
        'sell500':dataJson['sell500'],
        'split500':dataJson['split500'],
        'buyPrice30DayMedianDelta':dataJson['buyPrice30DayMedianDelta'],
        'sellPrice30DayMedianDelta':dataJson['sellPrice30DayMedianDelta'],
        'splitPrice30DayMedianDelta':dataJson['splitPrice30DayMedianDelta'],
        'buyPrice30DayMedian':dataJson['buyPrice30DayMedian'],
        'sellPrice30DayMedian':dataJson['sellPrice30DayMedian'],
        'splitPrice30DayMedian':dataJson['splitPrice30DayMedian'],
        'timeHistory':JSON.stringify(history['times']),
        'sellHistory':history['maxs'],
        'buyHistory':history['mins']
    }
    let priceImg = await render('eve', 'price',imgData );
    console.log(imgData)
    let sendMsg = []

    sendMsg.push(segment.image(`base64://${priceImg}`))
    sendMsg.push('\n')
    sendMsg.push(dataJson['typeName'])
    sendMsg.push('\n收单：')
    sendMsg.push(dataJson['buy'])
    sendMsg.push('\n卖单：')
    sendMsg.push(dataJson['sell'])
    sendMsg.push('\n=============\n')

    e.reply(sendMsg)
    return false;
}
