/// <reference path="./node_modules/node-mysql-wrapper/compiled/typings/node-mysql-wrapper/node-mysql-wrapper.d.ts" />
var express = require('express');
var app = express();
var server = require('http').createServer(app);
import * as wrapper2 from "node-mysql-wrapper";
var db = wrapper2.wrap("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8");
class User {
    constructor() {
        this.comments = [];
        this.myComments = [];
    }
}
function extendTypes(first, second) {
    let result = {};
    for (let id in first) {
        result[id] = first[id];
    }
    for (let id in second) {
        if (!result.hasOwnProperty(id)) {
            result[id] = second[id];
        }
    }
    return result;
}
db.ready(() => {
    var usersTable = db.table("users");
    var usersCollection = new wrapper2.ObservableCollection(usersTable);
    usersCollection.onCollectionChanged((eventArgs) => {
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
    usersTable.findSingle(_criteria16, result => {
        var user = wrapper2.observable(result);
        user.onPropertyChanged((args) => {
            console.log(args.propertyName + " Has changed to " + user[args.propertyName] + " from " + args.oldValue);
        });
        user.username = "just a test...";
        console.dir(user.toJSON("password", "myComments"));
    });
});
server.on('uncaughtException', function (err) {
    console.log(err);
});
var httpPort = 1193;
server.listen(httpPort, function () {
    console.log("Server is running on " + httpPort);
});
