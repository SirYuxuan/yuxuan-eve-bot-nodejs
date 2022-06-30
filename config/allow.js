// 全局的功能使用群组限制 [] = 不限制任何群使用，[-1] = 不允许任何群使用
let allow = {
    eve: {
        default:[],
    },
    corp: {
        default:[],
        info:[ 985570381,601162540],
        pap:[ 985570381,601162540],
        rat:[ 985570381,601162540],
        checkJoin:[601162540]
    },
    help: {
        default:[],
    },
}

export {allow}