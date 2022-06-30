import {post, get} from "../../utils/http.js";
import {universeIds, industrySystems, marketsHistory, getTypeEnName} from '../../utils/esi.js'

/*
* Eve Class
* 提供Eve实例相关的操作方法
*/
class EveService {

}

/**
 * 根据名称获取制造系数
 * @param name 星系名称
 * @returns {Promise<void>}
 */
EveService.getIndustrySystems = async function (name) {

    let systemId = await universeIds([name])
    if (!systemId) {
        return undefined
    }
    const systemMap = await industrySystems()
    if (systemMap[systemId]) {
        return systemMap[systemId]
    }
    return undefined
}
/**
 * 获取指定物品的价格
 * @param isEur 服务器
 * @param name 物品
 * @returns {Promise<*[]>}
 */
EveService.getPrice = async function (isEur, name) {
    let url = 'https://www.ceve-market.org/' + (isEur ? 'tqapi/' : 'api/')

    let result = []

    let painting = name.endsWith("皮肤")
    if (painting) {
        name = name.replace("皮肤", "")
    }

    // TODO 别名和英文名
    let nameJson = await post(url + 'searchname', {'name': name})
    if (!nameJson || nameJson.length === 0) {
        return result
    }

    for (const item of nameJson) {
        let typeId = item['typeid']
        let typeName = item['typename']

        if (typeName.indexOf('蓝图') !== -1 && name.indexOf('蓝图') === -1) {
            continue
        }

        if (!painting && typeName.indexOf('涂装') !== -1 && name.indexOf('涂装') === -1) {
            continue;
        }

        let priceJson = await get(url + 'market/region/10000002/system/30000142/type/' + typeId + '.json', {})
        let param = {
            'typeId': typeId,
            'typeName': typeName,
            'typeEnName': await getTypeEnName(typeId),
            'sell': priceJson['sell']['min'],
            'buy': priceJson['buy']['max'],
        }
        if (typeName === name) {
            result = [param]
            break
        } else {
            result.push(param)
        }

    }

    if (result.length === 1) {
        // 一条数据时获取价格走势
        const typeId = result[0]['typeId']
        let historyJson = await marketsHistory(typeId,isEur)
        let time = []
        let sell = []
        let buy = []
        let before = new Date(new Date() - BotConfig.app.eve.market.echartsDay)
        for (let item of historyJson) {
            if (BotConfig.app.eve.market.echartsDay !== -1 && new Date(item['date']) < before) {
                continue
            }
            time.push(item['date'])
            sell.push(item['highest'])
            buy.push(item['lowest'])
        }
        result[0]['timeHistory'] = JSON.stringify(time)
        result[0]['sellHistory'] = sell
        result[0]['buyHistory'] = buy
        result[0]['history'] = historyJson
    }

    return result
}

export default EveService