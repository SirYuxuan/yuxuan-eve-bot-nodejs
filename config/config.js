/**
 * 默认配置
 * 请复制一份重命名为config.js
 * 然后填写配置信息，支持热更新
 */
let config = {
    //qq账号 密码
    account: {
        qq:"2438372649",  //账号
        pwd:"",  //密码，可为空则用扫码登录
        logLevel: 'info', //日志等级:trace,debug,info,warn,error,fatal,mark,off
        platform:"5",       //1:安卓手机、 2:aPad 、 3:安卓手表、 4:MacOS 、 5:iPad
        autoFriend: 1,     //1-自动同意加好友 0-好友请求不处理
    },
    // 主人QQ
    masterQQ: [1718018032,],
    //黑名单qq
    blackQQ:[863992136],
    //黑名单q群
    blackGroup:[],
    // app模组配置
    app:{
        corp:{
            path: 'http://api.hd-eve.com/'
        },
        eve:{
            adGroup:[
                985570381,
                860982239,
                1007805049
            ],
            market:{
                // 显示多少天的图表，-1为最大时间
                echartsDay: -1
            }
        },
    },
    // 没有权限时的提示语
    notAllow: '本群尚未启用此功能，如需使用请联系雨轩：1718018032，或移除此机器人',
    //redis配置
    redis: {
        //host: "redis",   //docker redis容器地址，如果使用docker请取消注释此行并注释下一行
        host: "127.0.0.1", //redis地址
        port: 6379,        //redis端口
        password: "",      //redis密码，没有密码可以为空
        db: 10,             //redis数据库
    },

}

export { config }