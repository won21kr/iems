import React from 'react'
import { Link } from 'react-router'
import jQuery from 'jquery'

import { Page, ErrorMessage, Loading } from './Page'
import { toArray, groupBy, clone, map } from '../utils'
import { apiurl } from '../settings'

// filters in url
// load, save error handling
// add exp => update filters
// better server side
// remember filters
// undo
// better props/tags structure
// css
// redux?
// preloading
// search filter

export default class Experiments extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      init: { loading: true, error: null },
      save: { saving: false, error: null  },

      experiments: {}, // loaded experiments, { id: object }
      filters: {},     // selected filters, { group: { filter: true, filter2: false } }
      groupby: null    // filter name to group experiments by
    }
  }

  componentDidMount() {
    this.loadExperiments()
  }

  makeFilters(experiments) {
    // todo: preserve old values when ovrriding
    let filters = {}
    for (let exp of experiments) {
      for (let tag in exp.tags) {
        let val = exp.tags[tag]
        if (!filters[tag]) filters[tag] = {}
        if (!filters[tag][val]) filters[tag][val] = { count: 0, selected: false }
        filters[tag][val].count++
      }
    }
    return filters
  }

  isExprimentFiltered(exp) {
    for (let tag in exp.tags) {
      // ignore this filter if all are unselected
      if (Object.keys(this.state.filters[tag]).filter(f => this.state.filters[tag][f].selected).length == 0) {
        continue;
      }
      if (!this.state.filters[tag][exp.tags[tag]].selected) {
        return false
      }
    }
    return true
  }

  onFiltersChange(filters) {
    this.setState({ filters: filters })
  }

  onGroupByChange(groupby) {
    this.setState({ groupby: groupby })
  }

  loadExperiments() {
    this.setState({ init: { loading: true, error: null }})

    jQuery
      .get(`${apiurl}/experiments`)
      .done(exps => {
        this.setState({
          init: { loading: false, error: null },
          experiments: exps,
          filters: this.makeFilters(toArray(exps))
        })
      })
      .fail(err => {
        this.setState({ init: { loading: false, error: 'Could not load experiments' } })
      })
  }

  createExperiment() {
    let exp = {
      id: 'exp-' + Math.round(Math.random() * 1000),
      name: 'New Experiment',
      vars: {},
      "created": new Date().toString(),
      "updated": new Date().toString(),
      tags: {},
      "graph": {
        "id": 0, "title": "Main", "type": "main", "category": "undefined",
        "x": 0, "y": 0, "collapsed": false,
        "processes": [], "groups": [], "links": []
      }
    }

    jQuery.ajax({
      type: 'POST',
      url: `${apiurl}/experiments/${exp.id}`,
      data: JSON.stringify(exp),
      contentType: 'application/json',
      success: (res) => {
        console.log(res)
        this.state.experiments[exp.id] = exp
        this.setState(this.state)
      },
    })
  }

  cloneExperiment(exp) {
    let clonedexp = clone(exp)
    clonedexp.id = exp.id + '-clone'

    let i;
    for (i = 0; this.state.experiments[clonedexp.id]; i++) {
      clonedexp.id = exp.id + '-clone' + (i ? i : '')
    }

    clonedexp.name = clonedexp.name + ' (Clone' + (i ? ` #${i}` : '') + ')'

    this.setState({ save: { saving: true, error: null }})

    jQuery.ajax({
      type: 'POST',
      url: `${apiurl}/experiments/${clonedexp.id}`,
      data: JSON.stringify(clonedexp),
      contentType: 'application/json',
      success: () => {
        this.state.experiments[clonedexp.id] = clonedexp
        this.setState({
          save: { saving: false, error: null },
          experiments: this.state.experiments,
          filters: this.makeFilters(toArray(this.state.experiments))
        })
      },
      error: msg => {
        console.error(msg)
        this.setState({ save: { saving: false, error: `Could not clone experiment ${exp.name}` } })
      }
    })
  }

  deleteExperiment(exp) {
    this.setState({ save: { saving: true, error: null }})

    jQuery.ajax({
      type: 'DELETE',
      url: `${apiurl}/experiments/${exp.id}`,
      success: () => {
        delete this.state.experiments[exp.id]
        this.setState({
          save: { saving: false, error: null },
          experiments: this.state.experiments,
          filters: this.makeFilters(toArray(this.state.experiments))
        })
      },
      error: msg => {
        console.error(msg)
        this.setState({ save: { saving: false, error: `Could not clone experiment ${exp.name}` } })
      }
    })
  }

  render() {
    let heading = 'Experiments'

    if (this.state.init.loading) {
      return (
        <Page heading={heading}>
          <Loading/>
        </Page>
      )
    }

    if (this.state.init.error) {
      return (
        <Page heading={heading}>
          <ErrorMessage error={this.state.init.error} retry={() => this.loadExperiments()}/>
        </Page>
      )
    }

    let extra;
    if (this.state.save.saving) {
      extra = <p>Saving...</p>
    }
    if (this.state.save.error) {
      extra = <ErrorMessage error={this.state.save.error} dismiss={true} />
    }

    let experiments = toArray(this.state.experiments).filter(this.isExprimentFiltered.bind(this))
    let groups = groupBy(experiments, e => e.tags[this.state.groupby])

    return (
      <Page heading={heading}>
        {extra}

        <div style={{'display': 'flex'}}>
          <section className="experiments-container">
            {map(groups, (key, group) => (
              <div key={key}>
                {this.state.groupby ? <h2>{this.state.groupby + ': ' + key}</h2> : null}
                <table className="experiments">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {group.map(e => (
                    <tr key={e.id}>
                      <td><Link to={`/experiments/${e.id}`}>{e.name}</Link></td>
                      <td>
                        <button onClick={() => this.cloneExperiment(e)}>Clone</button>
                        {' '}
                        <button onClick={() => this.deleteExperiment(e)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                </table>
              </div>
            ))}
          </section>

          <section className="filters">
            <p>
              <input type="text" placeholder="Search"/>
              <button onClick={() => this.createExperiment()}>Create</button>
            </p>

            <p>Group by:{' '}
              <select onChange={e => this.onGroupByChange(e.target.value)}>
                <option value="">-- None --</option>
                {map(this.state.filters, key => <option key={key} value={key}>{key}</option>)}
              </select>
            </p>

            <Filters filters={this.state.filters} onChange={filters => this.onFiltersChange(filters)}/>
          </section>
        </div>
      </Page>
    )
  }
}

class Filters extends React.Component {
  constructor(props) {
    super(props)
  }

  onChange(key, changes) {
    let allfilters = clone(this.props.filters)

    for (let filter in allfilters[key]) {
      if (filter in changes) {
        allfilters[key][filter].selected = changes[filter]
      }
    }

    this.props.onChange(allfilters)
  }

  render() {
    return (
      <div>
        {map(this.props.filters, (key, filter) => (
          <Filter key={key} name={key} filters={filter}
                  onChange={changes => this.onChange(key, changes)} />
        ))}
      </div>
    )
  }
}

class Filter extends React.Component {
  constructor(props) {
    super(props)
  }

  check(e, name, selected) {
    this.props.onChange({ [name]: selected })
  }

  checkAll(e, selected) {
    e.preventDefault()

    let changes = {}
    for (let name in this.props.filters) {
      changes[name] = selected
    }
    this.props.onChange(changes)
  }

  render() {
    return (
      <div className="filter-group">
        <h3>{this.props.name}</h3>
        <p>
          <a href onClick={e => this.checkAll(e, true)}>Select all</a>
          {' '}
          <a href onClick={e => this.checkAll(e, false)}>Clear all</a>
        </p>
        <ul>
          {map(this.props.filters, (name, filter) => (
            <li key={name}>
              <label>
                <input type="checkbox" checked={filter.selected}
                      onChange={e => this.check(e, name, e.target.checked)}/>
                {name}{' '}
                <small>({filter.count})</small>
              </label>
            </li>
          ))}
        </ul>
      </div>
    )
  }
}
