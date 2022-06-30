import fetch from 'node-fetch'
import qs from 'qs'

/**
 * 请求接口获取数据
 * @param url 接口地址
 * @param data 参数
 * @param isJson 是否是JSON参数
 * @returns {Promise<unknown>}
 */
export async function post(url, data, isJson = false) {
    let response = await fetch(url, {
        method: "POST",
        headers: {
            'Content-Type': isJson ? 'application/json; charset=UTF-8' : 'application/x-www-form-urlencoded'
        },
        body: isJson ? JSON.stringify(data) : decodeURIComponent(qs.stringify(data, {indices: false}))
    });
    return await response.json()
}

/**
 * 请求接口获取数据
 * @param url 接口地址
 * @param data 参数
 * @returns {Promise<unknown>}
 */
export async function get(url, data = {}) {
    let response = await fetch(url + (url.indexOf('?') === -1 ? '?': '&') + decodeURIComponent(qs.stringify(data, {indices: false})));
    return await response.json()
}