/// <reference path="./node_modules/node-mysql-wrapper/compiled/typings/node-mysql-wrapper/node-mysql-wrapper.d.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var wrapper2 = require("node-mysql-wrapper");
var db = wrapper2.wrap("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8");
var User = (function (_super) {
    __extends(User, _super);
    function User() {
        _super.apply(this, arguments);
        this.comments = [];
        this.myComments = [];
    }
    return User;
})(wrapper2.ObservableObject);
function userChanged(user) {
    return function (propertyArgs) {
        console.log(propertyArgs.propertyName + ' property has changed from user with ID:' + user.userId + " old value: " +
            propertyArgs.oldValue + " to new value: " + user[propertyArgs.propertyName]);
    };
}
db.ready(function () {
    var usersDb = db.table("users");
    //or var usersDb = db.table("users"); if you don't want intel auto complete from your ide/editor
    var usersCollection = usersDb.observe(true);
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
    var _criteria16 = usersDb.criteria.where("userId", 16).joinAs("myComments", "comments", "userId").orderBy("userId", true).limit(1).build();
    usersDb.findSingle(_criteria16, function (user) {
        user.onPropertyChanged(function (args) {
            console.log(args.propertyName + " Has changed to " + user[args.propertyName] + " from " + args.oldValue);
        });
        user.username = "just a test...";
        console.dir(user.toJSON("password", "myComments"));
    });
    /*  usersDb.findById(16, (_user) => {
  
          console.log("TEST1: \n");
          console.log("FOUND USER WITH USERNAME: " + _user.username);
          observePropertyChanged(_user, (propertyName, newValue, oldValue) => {
              console.log(propertyName + ' property has changed from ' + oldValue + " to new value: " + newValue);
  
          });
  
          console.log(_user.mail);
  
          
          //  var itemAdded = usersCollection.addItem(_user); //addItem returns the last added item. the inside item is a copy of the _user, no reference. applied.
          //  itemAdded.onPropertyChanged(userChanged(itemAdded.item));
          /*	itemAdded.onPropertyChanged(propertyArgs=> {
                  console.log(propertyArgs.propertyName + ' property has changed from user with ID:' + itemAdded.item.userId + " old value: " + propertyArgs.oldValue + " to new value: " + itemAdded.item[propertyArgs.propertyName]);
              });
          _user.username = "username of 16";
          //or: {userId:16,username:  "JUST A NEW username for the user ID 16"}
          usersDb.save(_user).then(() => {
  
              console.log('user saved from query');
              console.log(_user.userId + " is the id");
              //   usersDb.remove(_user.userId);
          });
  
      });
      
  
  
      //a test.
      function observePropertyChanged(obj: any, cb: (propertyName: string, newValue: any, oldValue: any) => void): void {
  
          for (var key in obj) {
              obj["_" + key] = obj[key];
              delete obj[key];
          }
  
          wrapper2.Helper.forEachKey(obj, key => {
              var propertyName: string = key["substr"](1);
  
              Object.defineProperty(obj.constructor.prototype, propertyName, {
                  get: function() {
                      return obj[key];
                      //return this.get(key);
                  },
                  set: function(_value) {
  
                      if (_value !== undefined && obj[key] !== _value) {
                          //notify here
                          cb(propertyName, _value, obj[key]);
                      }
                      obj[key] = _value;
                      //this.set(key, _value);
                  },
                  enumerable: false, // test
                  configurable: true
  
              });
          });
      }
  
  
  */
});
server.on('uncaughtException', function (err) {
    console.log(err);
});
var httpPort = 1193; //config.get('Server.port') || 1193;
server.listen(httpPort, function () {
    console.log("Server is running on " + httpPort);
});
