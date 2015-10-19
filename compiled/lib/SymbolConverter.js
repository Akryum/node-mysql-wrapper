var SymbolConverter = (function () {
    function SymbolConverter() {
    }
    SymbolConverter.toMysql = function (_symbol) {
        _symbol = _symbol.replace(/\s/g, "");
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
    };
    SymbolConverter.toJS = function (_symbol) {
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
    };
    return SymbolConverter;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SymbolConverter;
