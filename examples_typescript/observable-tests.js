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
    var usersTable = db.table("users");
    var usersCollection = new mysqlWrapper.ObservableCollection(usersTable);
    usersCollection.onCollectionChanged(function (eventArgs) {
        console.log('collection changed');
        switch (eventArgs.action) {
            case mysqlWrapper.CollectionChangedAction.ADD:
                console.log('User(s) added into. New list lengh: ' + eventArgs.newItems.length);
                break;
            case mysqlWrapper.CollectionChangedAction.REMOVE:
                console.log(eventArgs.oldItems.length + " User(s) removed from list.");
                break;
        }
    });
    var _criteria16 = usersTable.criteria.where("userId", 16).joinAs("myComments", "comments", "userId").orderBy("userId", true).limit(1).build();
    usersTable.findSingle(_criteria16, function (userRow) {
        if (userRow === undefined) {
            console.log('This User does not  found');
            return;
        }
        var user = mysqlWrapper.observable(userRow);
        console.dir(user);
        usersCollection.addItem(user);
        user.onPropertyChanged(function (args) {
            console.log(args.propertyName + " Has changed to " + user[args.propertyName] + " from " + args.oldValue);
        });
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
