var Toolbox = React.createClass({
  getInitialState: function() {
    return { dragging: null };
  },

  dragStart: function(e, key) {
    // todo: set image
    this.setState({ dragging: key });
  },

  dragEnd: function(e) {
    if (this.state.dragging) {
      addAction(this.state.dragging, e.pageX, e.pageY)
      this.setState({ dragging: null });
    }
  },

  render: function() {
    return (
      <div>
        <h2>Toolbox</h2>
        <ul>
          {Object.keys(processes).map((key) => (
            <li key={key}
              draggable="true"
              onDragStart={(e) => this.dragStart(e, key)}
              onDragEnd={this.dragEnd}>
              {processes[key].name}
            </li>
          ))}
        </ul>
      </div>
    );
  }
});

var Properties = React.createClass({
  mixins: [Reflux.ListenerMixin],

  getInitialState: function() {
    return { selected: [] };
  },

  componentDidMount: function() {
     this.listenTo(selectAction, this.onSelect);
   },

   onSelect: function(obj) {
     var index = this.state.selected.indexOf(obj);
     if (index == -1) {
       this.state.selected.push(obj);
     } else {
       this.state.selected.splice(index, 1);
     }
     this.setState(this.state);
   },

  render: function() {
    var body;
    if (this.state.selected.length == 0) {
      body = <div>Nothing selected</div>;
    } else if (this.state.selected.length == 1) {
      console.log()
      var p = this.state.selected[0];
      var children = Object.keys(processes[p.name].params).map(key => {
        return (
          <p key={key}>{key}: <input type="text" value={p.params[key]}/></p>
        )
      });
      body = <div>here we go {children}</div>;
    } else {
      body = <div>Too many selected: {this.state.selected.length}</div>;
    }
    return (
      <div>
        <h2>Properties</h2>
        {body}
      </div>
    );
  }
});
