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

    var usersCollection = db.collection("users");
    /* --------------OR-------------------------
    var usersTable= db.table<User>("users");
    
    var usersCollection = new mysqlWrapper.ObservableCollection(usersTable,true);
     //second parameter:  true is the default on db.Collection but no from mysqlWrapper.
     //if second parameter is true then collection will fire the table.findAll(); and cache the results into a list.
     //All cached objects/items inside the list are observable too ( mysqlWrapper.observable(object)).
     //means that you can use usersCollection.items[0].onPropertyChanged(args=>{ //args.propertyName and args.oldValue });
    
    */
    usersCollection.onCollectionChanged((eventArgs) => {
        switch (eventArgs.action) {
            case mysqlWrapper.CollectionChangedAction.INSERT:
                console.log('User(s) added into. New list length: ' + eventArgs.newItems.length);
                break;
            case mysqlWrapper.CollectionChangedAction.DELETE:
                console.log(eventArgs.oldItems.length + " User(s) removed from list. New list length:" + eventArgs.newItems.length);
                break;

        }
    });
    
    //objects which updated from database are auto-update their values (if new new value != old value) here too,
    //use of onPropertyChanged (if you want to listen for this event on a specific object) bellow...


    /*
        Example of single observable object: 
        
        var _criteria16 = usersTable.criteria.where("userId", 16).joinAs("myComments", "comments", "userId").orderBy("userId", true).limit(1).build();
    
    
    
        usersTable.findSingle(_criteria16, userRow=> {
            //this is intersection typed
            if(userRow===undefined){
                console.log('This User does not  found');
                return;
            }
            var user = mysqlWrapper.observable(userRow);
     
            user.onPropertyChanged((args) => {
                console.log(args.propertyName + " Has changed to " + user[args.propertyName] + " from " + args.oldValue);
            });
    
    
             user.username = "new username for 16..."; //occurs property changed
      
              
             usersTable.save(user).then(() => { // occurs nothing because we already changed this property to its newest value, no directly from database or any other application
                  
             });
            
            usersTable.remove(user).then(() => {
              usersCollection.removeItem(user);//occurs collection changed - > DELETE action
            });
           
            // console.dir(user.toJSON("password", "myComments")); //print the object without password and myComments property fields.
        });*/

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
