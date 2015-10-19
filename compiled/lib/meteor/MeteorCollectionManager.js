var MeteorCollectionManager = (function () {
    function MeteorCollectionManager() {
        this.infos = [];
    }
    MeteorCollectionManager.getInstance = function () {
        if (MeteorCollectionManager._instance === undefined) {
            MeteorCollectionManager._instance = new MeteorCollectionManager();
        }
        return MeteorCollectionManager._instance;
    };
    MeteorCollectionManager._instance = undefined;
    return MeteorCollectionManager;
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MeteorCollectionManager;
