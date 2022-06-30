import {get} from "./http.js";

/**
 * 判断一个QQ号是否可以加群
 * @param qq QQ号
 * @returns {Promise<*>}
 */
export async function checkJoinGroup(qq) {
    return await get(BotConfig.app.corp.path + 'api/checkJoinGroup', {qq: qq})
}