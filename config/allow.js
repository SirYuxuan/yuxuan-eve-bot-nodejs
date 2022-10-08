// 全局的功能使用群组限制 [] = 不限制任何群使用，[-1] = 不允许任何群使用
let allow = {
    eve: {
        default:[],
    },
    corp: {
        default:[-1],
        info:[ 985570381,601162540,885949247],
        pap:[ 985570381,601162540,885949247],
        rat:[ 985570381,601162540,885949247],
        lp:[ 985570381,601162540,885949247],
        checkJoin:[860982239,797215188],
        papRank:[860982239,985570381,885949247],
    },
    help: {
        default:[],
    },
}

export {allow}
