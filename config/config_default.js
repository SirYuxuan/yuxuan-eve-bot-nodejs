/**
 * 默认配置
 * 请复制一份重命名为config.js
 * 然后填写配置信息，支持热更新
 */
let config = {
    //qq账号 密码
    account: {
        qq:  '',  //账号
        pwd: '',  //密码，可为空则用扫码登录
        logLevel: 'info', //日志等级:trace,debug,info,warn,error,fatal,mark,off
        platform: 5,       //1:安卓手机、 2:aPad 、 3:安卓手表、 4:MacOS 、 5:iPad
        autoFriend: 1,     //1-自动同意加好友 0-好友请求不处理
    },
    // 主人QQ
    masterQQ:[123456,],

    //redis配置(默认配置就好，一般都不用改，使用docker搭建的用户需要更改host项)
    redis: {
        //host: "redis",   //docker redis容器地址，如果使用docker请取消注释此行并注释下一行
        host: "127.0.0.1", //redis地址
        port: 6379,        //redis端口
        password: "",      //redis密码，没有密码可以为空
        db: 0,             //redis数据库
    },
    //群设置
    group: {
        //通用默认配置(不能删除)
        'default': {
            onlyReplyAt: false, // 只关注主动at bot的信息
            botAlias: '雨轩'
        }
    }
}

export { config }