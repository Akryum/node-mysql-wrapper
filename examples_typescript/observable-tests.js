var express = require('express');
var http = require('http');
var mysqlWrapper = require("node-mysql-wrapper");
var app = express();
var server = http.createServer(app);
var db = mysqlWrapper.wrap("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8");
var User = (function () {
    function User() {
        this.comments = [];
        this.myComments = [];
    }
    return User;
})();
db.ready(function () {
    var usersCollection = db.collection("users");
    usersCollection.onCollectionChanged(function (eventArgs) {
        switch (eventArgs.action) {
            case mysqlWrapper.CollectionChangedAction.INSERT:
                console.log('User(s) added into. New list length: ' + eventArgs.newItems.length);
                break;
            case mysqlWrapper.CollectionChangedAction.DELETE:
                console.log(eventArgs.oldItems.length + " User(s) removed from list. New list length:" + eventArgs.newItems.length);
                break;
        }
    });
});
server.on('uncaughtException', function (err) {
    console.log(err);
});
process.on("SIGHUP", function () {
    db.end(function (err) {
        if (err) {
            console.dir(err);
            setTimeout(function () {
                process.exit();
            }, 8000);
        }
        else {
            process.exit();
        }
    });
});
var httpPort = 1193;
server.listen(httpPort, function () {
    console.log("Server is running on " + httpPort);
});
