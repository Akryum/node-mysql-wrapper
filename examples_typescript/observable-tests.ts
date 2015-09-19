import * as express from 'express';
import * as http from 'http';
import * as mysqlWrapper from "node-mysql-wrapper";
var app = express();
var server = http.createServer(app);


var db = mysqlWrapper.wrap("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8");

class User { //or interface
    userId: number;
    username: string;
    mail: string;
    password: string;
    comments: Comment[] = [];
    myComments: Comment[] = [];
    info: UserInfo;
}

interface Comment {
    commentId: number;
    content: string;
    likes: CommentLike[];

}
interface CommentLike {
    commentLikeId: number;
    userId: number;
    commentId: number;
}

interface UserInfo {
    userInfoId: number;
    userId: number;
    hometown: string;
}

db.ready(() => {
    var usersTable = db.table<User>("users");
/*
    usersTable.on("INSERT", (rawRows: any[]) => {
        console.log("INSERT DIRECTLY FROM DATABASE EXECUTED.");
    });*/
    
    //or var usersDb = db.table("users"); if you don't want intel auto complete from your ide/editor
    var usersCollection = new mysqlWrapper.ObservableCollection(usersTable); 
    //the collection can contains 'pure row objects' from a table method results and can contains ObservableObjects. Yes in the same list.
    usersCollection.onCollectionChanged((eventArgs) => {

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



    usersTable.findSingle(_criteria16, userRow=> {
        //this is intersection typed
        if(userRow===undefined){
            console.log('This User does not  found');
            return;
        }
        var user = mysqlWrapper.observable(userRow);
        console.dir(user);
        usersCollection.addItem(user); //or add simple row object: addItem(userRow)
        
        //to get an item: usersCollection.getItemObservable(0) or .getItem(index)
        //getItemObservable(index) check if the item on index is observable if yes,it returns it, if not it will make one and return that.
 
 
        user.onPropertyChanged((args) => {
            console.log(args.propertyName + " Has changed to " + user[args.propertyName] + " from " + args.oldValue);
        });


        /* user.username = "new username for 16..."; //occurs property changed
  
          
         usersTable.save(user).then(() => { // occurs nothing because we changed from here, no directly from database or any other application
              
         });
        
                 usersTable.remove(user).then(() => {
                     usersCollection.removeItem(user);//occurs collection changed
                 });*/
       
        // console.dir(user.toJSON("password", "myComments")); //print the object without password and myComments property fields.
    });

});

server.on('uncaughtException', function(err) {
    console.log(err);
});

process.on("SIGHUP", () => {
    db.end((err) => {
        if (err) {
            console.dir(err);
            setTimeout(() => {
                process.exit();
            }, 8000);
        } else {
            process.exit();
        }

    });
});

var httpPort = 1193;//config.get('Server.port') || 1193;
server.listen(httpPort, function() {
    console.log("Server is running on " + httpPort);
});
