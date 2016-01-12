import React from 'react'

import Actions from './Actions'

export default React.createClass({
  //mixins: [React.addons.PureRenderMixin],

  onChange: (key, value) => {
    Actions.variableChanged(key, value);
  },

  onAdd: function() {
    let varName = this.refs.key.value
    if (!varName.length) return
    if (varName[0] == '$') varName = varName.substr(1) // remove accidental $
    this.onChange(varName, this.refs.value.value);
    this.refs.key.value = this.refs.value.value = '';
  },

  onEnter: function(e) {
    if (e.keyCode == 13) {
      this.onAdd();
    }
  },

  render: function() {
    var children = Object.keys(this.props.vars)
      .map(key => (
        <tr key={key}>
        <th>{key}</th>
        <td><input type="text" value={this.props.vars[key]} onChange={(e) => this.onChange(key, e.target.value)}/></td>
        </tr>
      ));

    return (
      <div>
        <h2>Variables</h2>
        <table>
        <tbody>
          {children}
          <tr>
            <th><input type="text" ref="key" onKeyUp={this.onEnter} /></th>
            <td><input type="text" ref="value" onKeyUp={this.onEnter}/></td>
          </tr>
        </tbody>
        </table>
      </div>
    );
  }
});
