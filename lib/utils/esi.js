import {get, post} from "./http.js";

let esiPath = 'https://esi.evetech.net/latest/'
let esi163Path = 'https://esi.evepc.163.com/latest/'

/**
 * 查询市场交易历史
 * @param typeId 物品ID
 * @param isEur 是否是欧服
 * @returns {Promise<*>}
 */
export async function marketsHistory(typeId, isEur = true) {
   // return await get((isEur ? esiPath : esi163Path) + 'markets/10000002/history/', {type_id: typeId})
    return await post('https://janice.e-351.com/api/rpc/v1?m=Info.getMarketDetails',{
        '~request~':{"id":4098,"method":"Info.getMarketDetails","params":{"itemTypeEid":typeId,"marketId":2}}
    },false)
}

/**
 * 获取一个物品的英文名称
 * @param typeId 物品ID
 * @returns {Promise<string>}
 */
export async function getTypeEnName(typeId) {
    let key = `Yuxuan:EVE:Type:${typeId}`
    let val = await redis.get(key)
    if (val) {
        return val
    }
    let info = await get(esiPath + `universe/types/${typeId}/?datasource=tranquility&language=en`)
    redis.set(key, info['name'])
    return info['name']

}

/**
 * 查询工业星系数据
 * @returns {Promise<void>}
 */
export async function industrySystems(isEur = true) {
    let url = (isEur ? esiPath : esi163Path) + 'industry/systems/?datasource=tranquility'
    let systemArr = await get(url)
    let systemMap = {}
    for (let item of systemArr) {
        let costMap = {}
        for (const cost of item['cost_indices']) {
            costMap[cost['activity']] = cost['cost_index'] * 100
        }
        systemMap[item['solar_system_id']] = costMap
    }
    return systemMap
}

/**
 * 获取指定名称的ID
 * @param arr 名称数组
 * @returns {Promise<{}|*>}
 */
export async function universeIds(arr) {
    let idsJson = await post(esiPath + 'universe/ids/?datasource=tranquility&language=en', arr, true)
    if (idsJson.hasOwnProperty('error')) {
        return undefined
    }
    let idsMap = {}
    if (Object.keys(idsJson).length === 1) {
        let dataArr = idsJson[Object.keys(idsJson)[0]];
        if (dataArr.length === 1) {
            return dataArr[0]['id']
        }
        for (const data of dataArr) {
            idsMap[data['name']] = data['id']
        }
    } else {
        for (const obj in idsJson) {
            for (const objElement of idsJson[obj]) {
                idsMap[objElement['name']] = objElement['id']
            }
        }
    }
    return idsMap
}

