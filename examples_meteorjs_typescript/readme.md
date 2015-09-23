```js

if (Meteor.isServer) {
  Meteor.publish('items', function() {
    var self = this;
    self.added('items', '1', { title: 'One' });

    setTimeout(function() {
      self.changed('items', '1', { title: 'Changed One' });
    }, 3000);

    setTimeout(function() {
      self.removed('items', '1');
      self.ready();
    }, 6000);
  });
}

if (Meteor.isClient) {
  var itemsDep = new Deps.Dependency();
  var items[] = [];
  Meteor.connection.registerStore('items', {
    beginUpdate: function(batchSize, reset) {
     
    },

    update: function(msg) {

      items.push(msg.fields);
      itemsDep.changed();


    },

    endUpdate: function() {

    }
  });
  
    Meteor.subscribe('items');


  Template["itemsList"].helpers({
    items: function() {
      itemsDep.depend();
      return items;
    },
    length: function() {
      itemsDep.depend();
      return items.length;
    }
  });
}

```