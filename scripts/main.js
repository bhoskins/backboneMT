(function(){
  'use strict';
  //$('.test').css("color", "green");

  var Item = Backbone.Model.extend({
    defaults: {
      name: '',
      price: 0,
      category: ''


      // itemName: '',
      // itemDesc: '',
      // hasOrderExtra: false,
      // orderExtras: '[]',
      // itemPrice: 0,
      // category: '',
      // itemAllergens: [],
      // calories: ''
    }
  });

  var ItemCollection = Backbone.Collection.extend({
    model: Item,
    url: "https://api.parse.com/1/classes/r360",
    parse: function(response){
      return response.results;
    },
    initialize: function(){
      this.fetch().done(function(data){
      var results = data.results;
      console.log('this is the data');
      console.log(data);
      });
    },

    selectCategories: function(){
      return _.uniq(this.pluck('category')).map(function(cat){
        return {name: cat, slug: encodeURI(cat)};
      });
    }
  });

  var Order = Backbone.Model.extend({
    defaults: function(attributes) {
      attributes = attributes || {};
      return _.defaults(attributes, {
        items: []
      });
    },

    addItem: function(itemModel) {
      this.set('items', this.get('items').concat([itemModel.toJSON()]));
    },

    removeItem: function(item){

    },

    totalPrice: function(){

    },

    toJSON: function(){
      return _.extend({
        totalPrice: this.totalPrice()
      }, this.attributes);
    }
  });

  var OrderCollection = Backbone.Model.extend({
    model: Order,
    url: "https://api.parse.com/1/classes/Order",
    parse: function(response){
      return response.results;
    }
  });

  var CategoryView = Backbone.View.extend({
    template: _.template($('#category-view-template').text()),

    initialize: function(options){
      options = options || {};
      this.order = options.order;
      this.listenTo(this.collection, 'reset', this.render);
    },

    render: function(){
       _.invoke(this.children, 'remove');
       var category = this.collection.pluck('category')[0];

      this.$el.html(this.template({category: category}));

      var self = this;
      this.children = this.collection.map(function(item){
        var view = new ItemView({
          model: item,
          order: self.order
        });

        self.$('ul').append(view.render().el);
        return view;
      });

      return this;
    }
  });

  var ItemView = Backbone.View.extend({
    tagName: 'li',
    template: _.template($('#category-item-template').text()),

    initialize: function(options){
      options = options || {};
      this.order = options.order;
    },

    events: {
      'click .js-add': 'addItem'
    },

    addItem: function(){
      this.order.addItem(this.model);
    },

    render: function(){
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    }
  });

  var OrderView = Backbone.View.extend({
    template: _.template($('#order-view-template').text()),

    initialize: function(){
      this.listenTo(this.model, 'change', this.render);
    },

    render: function(){
      // remove children to avoid zombie views
      _.invoke(this.children, 'remove');

      this.$el.html(this.template(this.model.toJSON()));

      var self = this;
      this.children = this.model.get('items').map(function(item){
        var view = new OrderItemView({
          order: self.model,
          model: item
        });
        self.$('ul').append(view.render().el);
        return view;
      });

      return this;
    }
  });

  var OrderItemView = Backbone.View.extend({
    tagName: 'li',
    template: _.template($('#order-item-template').text()),

    events: {
      'click .js-remove': 'removeItem'
    },

    initialize: function(options){
      options = options || {};
      this.order = options.order;
    },

    removeItem: function(){
      this.order.removeItem(this.model);
    },

    render: function(){
      this.$el.html(this.template(this.model));
      return this;
    }
  });

  var NavView = Backbone.View.extend({
    render: function(){

    }
  });

  var NavItemView = Backbone.View.extend({
    tagName: 'li',
    template: _.template($('#nav-item-view').text()),

    render: function(){
      this.$el.html(this.template(this.model));
      return this;
    }
  });

  var AppRouter = Backbone.Router.extend({
    routes: {
      '': 'index',
      'category/:name': 'showCategory'
    },

    initialize: function(){
      this.appModel = new Backbone.Model();

      var self = this;
        //change:selectedCategory
      this.listenTo(this.appModel, 'change:selectedCategory', function(m, val){
        self.selectedItems.reset( self.items.where({category: val}) );
      });

      this.order = new Order();

      this.items = new ItemCollection();

      // new ItemCollection([
      //   {name: "Soup", price: 1, category: "Appetizers"},
      //   {name: "Real Food", price: 20, category: "Entree Items"}
      // ]);

      this.selectedItems = new ItemCollection();

      this.categoryView = new CategoryView({
        el: '.js-category-view',
        collection: this.selectedItems,
        order: this.order,
      });

      this.orderView = new OrderView({
        el: 'js-order-view',
        model: this.order
      });

      this.navView = new NavView({
        el: '.js-primary-nav',
        collection: this.items
      });

      this.categoryView.render();
      this.orderView.render();
      this.navView.render();
    },

    index: function(){
    },

    showCategory: function(name){
      // itemtype is a parse column name
      this.appModel.set('category', decodeURI(name));
    }

  });

// parse: GreatApp keys
  $.ajaxSetup({
    headers: {
      "X-Parse-Application-Id": "Cg7ixMBSyHJ7SsGTqXxUkE27s6PwNevbovd1RaG1",
      "X-Parse-REST-API-Key": "JzKJm6qSleHdYUXIiAMetmC6ruZYHoqsiHrm4Z8y"
    }
  });



$(document).ready(function(){
    window.router = new AppRouter();
    Backbone.history.start();
    console.log('its working');
  });
})();
