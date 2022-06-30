import {industrySystems, marketsHistory, universeIds} from "../lib/utils/esi.js";
import EveService from "../lib/components/models/EveService.js";

let json = await marketsHistory(17715)
