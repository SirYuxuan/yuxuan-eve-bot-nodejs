/**
 * 判断指定功能在指定群是否可用
 * @param type 功能模块
 * @param name 功能
 * @param groupId 群组
 * @returns {boolean}
 */
export function checkOpen(type,name,groupId){
    // 判断这个群是否开放这个功能
    let app = BotAllow[type]
    if (!app) {
        return false
    }
    let nameApp = app[name]
    if (!nameApp) {
        nameApp = app['default']
        if (!nameApp) {
            return false
        }
    }
    return !((nameApp.length === 1 && nameApp[0] === -1) || (nameApp.length !== 0 && nameApp.indexOf(groupId) === -1));

}

/**
 * 发送私聊消息，非好友以临时聊天发送
 * @param user_id qq号
 * @param msg 消息
 * @param isStranger 是否给陌生人发消息,默认false
 */
async function replyPrivate(user_id, msg, isStranger = false) {
    user_id = parseInt(user_id);
    let friend = Bot.fl.get(user_id);
    if (friend) {
        Bot.logger.mark(`发送好友消息[${friend.nickname}](${user_id})`);
        Bot.pickUser(user_id).sendMsg(msg).catch((err) => {
            Bot.logger.mark(err);
        });
        redis.incr(`Yuxuan:sendMsgNum:${BotConfig.account.qq}`);
    } else {
        //是否给陌生人发消息
        if (!isStranger) {
            return;
        }
        let key = `Yuxuan:group_id:${user_id}`;
        let group_id = await redis.get(key);

        if (!group_id) {
            for (let group of Bot.gl) {
                group[0] = parseInt(group[0])
                let MemberInfo = await Bot.getGroupMemberInfo(group[0], user_id).catch((err) => {
                });
                if (MemberInfo) {
                    group_id = group[0];
                    redis.set(key, group_id.toString(), {EX: 1209600});
                    break;
                }
            }
        } else {
            group_id = parseInt(group_id)
        }

        if (group_id) {

            Bot.logger.mark(`发送临时消息[${group_id}]（${user_id}）`);

            let res = await Bot.pickMember(group_id, user_id).sendMsg(msg).catch((err) => {
                Bot.logger.mark(err);
            });

            if (res) {
                redis.expire(key, 86400 * 15);
            } else {
                return;
            }

            redis.incr(`Yuxuan:sendMsgNum:${BotConfig.account.qq}`);
        } else {
            Bot.logger.mark(`发送临时消息失败：[${user_id}]`);
        }
    }

}

 function toThousands(str) {
    let i
    let newStr = ''
    let count = 0
    str = str + ''
    if (str.indexOf('.') === -1) {
        for (i = str.length - 1; i >= 0; i--) {
            if (count % 3 === 0 && count !== 0) {
                newStr = str.charAt(i) + ',' + newStr
            } else {
                newStr = str.charAt(i) + newStr
            }
            count++
        }
        str = newStr;
        return str
    } else {
        for (i = str.indexOf('.') - 1; i >= 0; i--) {
            if (count % 3 === 0 && count !== 0) {
                newStr = str.charAt(i) + ',' + newStr
            } else {
                newStr = str.charAt(i) + newStr //逐个字符相接起来
            }
            count++
        }
        str = newStr + (str + '00').substr((str + '00').indexOf('.'), 3)
        return str
    }
}


/**
 * 休眠函数
 * @param ms 毫秒
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 获取现在时间到今天23:59:59秒的秒数
 */
function getDayEnd() {
    let now = new Date();
    let dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), "23", "59", "59").getTime() / 1000;

    return dayEnd - parseInt(now.getTime() / 1000);
}


export default {replyPrivate, sleep, getDayEnd,toThousands,checkOpen};
