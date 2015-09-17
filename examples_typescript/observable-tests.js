var express = require('express');
var http = require('http');
var wrapper2 = require("node-mysql-wrapper");
var app = express();
var server = http.createServer(app);
var db = wrapper2.wrap("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8");
var User = (function () {
    function User() {
        this.comments = [];
        this.myComments = [];
    }
    return User;
})();
db.ready(function () {
    var usersTable = db.table("users");
    var usersCollection = new wrapper2.ObservableCollection(usersTable);
    usersCollection.onCollectionChanged(function (eventArgs) {
        console.log('collection changed');
        switch (eventArgs.action) {
            case wrapper2.CollectionChangedAction.ADD:
                console.log('User(s) added into. New list lengh: ' + eventArgs.newItems.length);
                break;
            case wrapper2.CollectionChangedAction.REMOVE:
                console.log(eventArgs.oldItems.length + " User(s) removed from list.");
                break;
        }
    });
    var _criteria16 = usersTable.criteria.where("userId", 16).joinAs("myComments", "comments", "userId").orderBy("userId", true).limit(1).build();
    usersTable.findSingle(_criteria16, function (userRow) {
        var user = wrapper2.observable(userRow);
        usersCollection.addItem(user);
        user.onPropertyChanged(function (args) {
            console.log(args.propertyName + " Has changed to " + user[args.propertyName] + " from " + args.oldValue);
        });
        user.username = "new username for 16...";
        usersTable.save(user).then(function () {
        });
        usersTable.remove(user).then(function () {
            usersCollection.removeItem(user);
        });
    });
});
server.on('uncaughtException', function (err) {
    console.log(err);
});
var httpPort = 1193;
server.listen(httpPort, function () {
    console.log("Server is running on " + httpPort);
});
