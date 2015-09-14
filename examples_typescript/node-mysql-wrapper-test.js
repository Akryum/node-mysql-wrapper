/// <reference path="./node_modules/node-mysql-wrapper/compiled/typings/node-mysql-wrapper/node-mysql-wrapper.d.ts" />
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var wrapper2 = require("node-mysql-wrapper");
var db = wrapper2.wrap("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8");
var User = (function () {
    function User() {
        this.comments = [];
        this.myComments = [];
    }
    return User;
})();
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
    usersDb.findById(16, function (_user) {
        console.log("TEST1: \n");
        console.log("FOUND USER WITH USERNAME: " + _user.username);
        var itemAdded = usersCollection.addItem(_user); //addItem returns the last added item. the inside item is a copy of the _user, no reference. applied.
        itemAdded.onPropertyChanged(function (propertyArgs) {
            console.log(propertyArgs.propertyName + ' property has changed from user with ID:' + itemAdded.item.userId + " old value: " + propertyArgs.oldValue + " to new value: " + itemAdded.item[propertyArgs.propertyName]);
        });
        _user.username = "JUST A NEW username for the user ID 16";
        //or: {userId:16,username:  "JUST A NEW username for the user ID 16"}
        usersDb.save(_user).then(function () { console.log('user saved from query'); });
    });
    /* OR   usersDb.findById(18).then(_user=> {
         console.log("FOUND USER WITH USERNAME: " + _user.username);
     }, (err) => { console.log("ERROR ON FETCHING FINDBY ID: " + err) });
   */
    /* usersDb.findSingle(
         {
             userId: 18,
             myComments: {
                 userId: '=',
                 tableRules: { //NEW: SET rules to joined tables too!
                     table: "comments", //NEW SET table name inside any property u want!
                     limit: 50,
                     orderByDesc: "commentId" //give me the first 50 comments ordered by -commentId (DESC) from table 'comments' and put them at 'myComments' property inside the result object.
                 }
             }
         }).then(_user=> { // to get this promise use : .promise()
             console.log("\n-------------TEST 2 ------------\n");
             console.log(_user.username + " with ");
             console.log(_user.myComments.length + " comments ");
             _user.myComments.forEach(_comment=> {
                 console.log("--------------\n" + _comment.content);
             });
         });
 
     /* usersDb.remove(5620, answer=> {
          console.log("TEST 3: \n");
          console.log(answer.affectedRows + ' (1) has removed from table:  ' + answer.table);
  
      });
  
      var auser = new User();
      auser.username = ' just a username';
      auser.mail = ' just an email';
  
      usersDb.save(auser, newUser=> {
          console.log("TEST 4: \n");
          console.log("NEW USER HAS CREATED WITH NEW USER ID: " + newUser.userId);
  
      });
  
  
  
      usersDb.find(
          {
              yearsOld: 22,
              comments: {
                  userId: "=",
                  tableRules: {
                      limit: 2
                  }
              }
  
          }, (_users) => {
  
              console.log("---------------TEST 6----------------------------------------");
              _users.forEach(_user=> {
                  console.log(_user.userId + " " + _user.username + " found with " + _user.comments.length + " comments");
  
              });
  
          });
      //if no rules setted to find method  it's uses the table's rules ( if exists)
      
      
      
      let _criteriaFromBuilder = usersDb.criteria
          .except("password") // or .exclude(...columns). the only column you cannot except/exclude is the primary key (because it is used at where clause), be careful.
          .where("userId", 24)
          .joinAs("info", "userInfos", "userId")
          .at("info")
          .limit(1) //because we make it limit 1 it will return this result as object not as array.
          .parent()
          .joinAs("myComments", "comments", "userId")
          .at("myComments").limit(2)
          .joinAs("likes", "commentLikes", "commentId")
          .original().orderBy("userId", true).build();
          
      /* console.dir(_criteriaFromBuilder);
       prints this object: ( of course you can create your own in order to pass it on .find table methods )
      {
          userId:23,
          
          myComments:{
              userId: '=',
              
              tableRules:{
                  table: 'comments',
                  limit:2
                 
              },
              
              likes:{
                  commentId: '=',
                  
                  tableRules:{
                      table: 'commentLikes'
                  }
                 
              }
          },
          
          tableRules:{
              orderByDesc: 'userId',
              except: ['password']
          }
          
      }
      
      
      */
    /*
        usersDb.find(_criteriaFromBuilder).then(_users=> {
            console.log("\n----------------\nTEST ADVANCED 1\n-------------------\n ");
            _users.forEach(_user=> {
                console.log(_user.userId + " " + _user.username);
    
                if (_user.info !== undefined) {
                    console.log(' from ' + _user.info.hometown);
                    //console.dir(_user.userInfos);
                }
    
                if (_user.myComments !== undefined) {
                    _user.myComments.forEach(_comment=> {
                        console.log(_comment.commentId + " " + _comment.content);
    
                        if (_comment.likes !== undefined) {
                            console.log(' with ' + _comment.likes.length + ' likes!');
                        }
                    });
                }
            });
    
        });
    
    */
});
server.on('uncaughtException', function (err) {
    console.log(err);
});
var httpPort = 1193; //config.get('Server.port') || 1193;
server.listen(httpPort, function () {
    console.log("Server is running on " + httpPort);
});
