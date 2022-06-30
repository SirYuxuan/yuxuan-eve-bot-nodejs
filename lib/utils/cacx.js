import {get} from "./http.js";

/**
 * 判断一个QQ号是否可以加群
 * @param qq QQ号
 * @returns {Promise<*>}
 */
export async function checkJoinGroup(qq) {
    return await get(BotConfig.app.corp.path + 'api/checkJoinGroup', {qq: qq})
}

/**
 * 获取物品别名
 * @param name  物品名
 * @returns {Promise<*>}
 */
export async function alias(name) {
    return await get(BotConfig.app.corp.path + 'api/alias', {name: name})
}
/**
 * 获取物品翻译
 * @param name  物品名
 * @returns {Promise<*>}
 */
export async function translate(name) {
    return await get(BotConfig.app.corp.path + 'api/translate', {name: name})
}