import * as express from 'express';
import * as http from 'http';
import * as wrapper2 from "node-mysql-wrapper";
var app = express();
var server = http.createServer(app);


var db = wrapper2.wrap("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8");

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
    //or var usersDb = db.table("users"); if you don't want intel auto complete from your ide/editor
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

    usersTable.findSingle(_criteria16, result=> {
        //this is intersection typed
        var user = wrapper2.observable(result);
        
        user.onPropertyChanged((args) => {
            console.log(args.propertyName + " Has changed to " + user[args.propertyName] + " from " + args.oldValue);
        });

        user.username = "just a test...";
        console.dir(user.toJSON("password", "myComments")); //except password and myComments property fields.
    });

});

server.on('uncaughtException', function(err) {
    console.log(err);
})

var httpPort = 1193;//config.get('Server.port') || 1193;
server.listen(httpPort, function() {
    console.log("Server is running on " + httpPort);
});
