var LiveCollectionManager = (function () {
    function LiveCollectionManager() {
    }
    LiveCollectionManager.getInstance = function () {
        if (LiveCollectionManager._instance === undefined) {
            LiveCollectionManager._instance = new LiveCollectionManager();
        }
        return LiveCollectionManager._instance;
    };
    LiveCollectionManager._instance = undefined;
    return LiveCollectionManager;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LiveCollectionManager;
