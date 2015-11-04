var LiveTable = (function () {
    function LiveTable() {
    }
    LiveTable.register = function (table, onInsert) {
        table.on("INSERT", function (rows) {
            rows.forEach(function (row) {
                var objRow = table.objectFromRow(row);
                onInsert(objRow);
            });
        });
    };
    return LiveTable;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LiveTable;
