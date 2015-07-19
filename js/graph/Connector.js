var Connector = React.createClass({
  mixins: [React.addons.PureRenderMixin],

  onClick: function() {
    selectAction(this.props.graph);
  },

  render: function() {
    var classes = 'connector';
    if (this.props.selected) classes += ' ' + 'selected';
    return (
      <g className={classes} onClick={this.onClick}>
        <line x1={this.props.source.x} y1={this.props.source.y}
              x2={this.props.target.x} y2={this.props.target.y} />
      </g>
    );
  }
});
