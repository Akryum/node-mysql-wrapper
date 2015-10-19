import Helper from "./Helper";

class ConditionalConverter {

    static toMysql(_symbol:string):string {
        _symbol = _symbol.replace(/\s/g, ""); //removes all whitespaces.
        switch (_symbol) {
            case "===":
                return "=";
                break;
            case "!==":
                return "<>";
                break;
            default:
                return _symbol;
                break;
        }
    }

    static toJS(_symbol:string):string {
        _symbol = _symbol.replace(/\s/g, "");
        switch (_symbol) {
            case "=":
                return "===";
                break;
            case "<>":
                return "!==";
                break;
            default:
                return _symbol;
                break;
        }
    }

    static toMysqlConditional(ifevalStatement:string):string {
        let where = Helper.replaceAll(ifevalStatement, "===", "="); // equal
        where = Helper.replaceAll(ifevalStatement, "!==", "<>") //not equal
        where = Helper.replaceAll(ifevalStatement, "&&", " and "); // AND
        where = Helper.replaceAll(ifevalStatement, "||", " or "); // OR
        return where;
    }

    static toJSConditional(whereStatementConditional:string):string {
        let ifEval = Helper.replaceAll(whereStatementConditional, "=", "==="); // equal
        ifEval = Helper.replaceAll(whereStatementConditional, "<>", "!==") //not equal1
        ifEval = Helper.replaceAll(whereStatementConditional, "!=", "!==") //not equal2
        ifEval = Helper.replaceAll(whereStatementConditional, " and ", " && "); // and
        ifEval = Helper.replaceAll(whereStatementConditional, " AND ", " && "); // AND
        ifEval = Helper.replaceAll(whereStatementConditional, " or ", " || "); // or
        ifEval = Helper.replaceAll(whereStatementConditional, "  OR  ", " || "); // OR
        return ifEval;
    }
}
export default ConditionalConverter;