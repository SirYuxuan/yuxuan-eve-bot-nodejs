let Msg = {}

/*
* 统一实现需要绑定混沌军团系统的方法
* */
Msg.replyNeedESIForCACX = function (e, replyMsg) {

  replyMsg = replyMsg || `您尚未在混沌军团系统中绑定QQ号，无法进行操作`

  if (e.isGroup) {
    e.reply([replyMsg])
  } else {
    e.reply(replyMsg)
  }

  return false
}



export default Msg