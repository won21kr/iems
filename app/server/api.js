"use strict"

let fs = require('fs')

let express = require('express')

let AwsEc2 = require('./services/awsec2').AwsEc2
let Vagrant = require('./services/vagrant').Vagrant

let cluster = require('../../build/db/cluster.js')

let awsec2 = new AwsEc2()
let vagrant = new Vagrant()

awsec2.connect(cluster.configs)
vagrant.connect(cluster.configs)
vagrant.scan()

let db = {
  experiments: require('../../build/db/experiments.json'),
  cluster: {
    services: {
      awsec2: awsec2,
      vagrant: vagrant
    }
  }
}

let app = module.exports = express.Router()

app.use('/api/*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080') // todo
  res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

app.get('/api/cluster/configs', (req, res) => {
  let configs = []
  for (let id in db.cluster.services) {
    let serviceConfigs = db.cluster.services[id].toJSON().configs
    for (let cid in serviceConfigs) {
      configs.push(serviceConfigs[cid])
    }
  }
  res.send(configs)
})

app.get('/api/cluster/services', (req, res) => {
  let services = {}
  for (let id in db.cluster.services)
    services[id] = db.cluster.services[id].toJSON()
  res.send(services)
})

app.get('/api/cluster/services/:id', (req, res) => {
  const service = db.cluster.services[req.params.id]
  if (service) res.send(service.toJSON())
  else res.status(404).send()
})

app.get('/api/cluster/services/:id/instances', (req, res) => {
  const service = db.cluster.services[req.params.id]
  if (service) res.send(service.toJSON().instances)
  else res.status(404).send()
})

app.delete('/api/cluster/services/:id/instances/:iid', (req, res) => {
  const service = db.cluster.services[req.params.id]
  if (service) {
    service.terminate(req.params.iid)
    res.send()
  } else {
    res.status(404).send('No such service')
  }
})

app.get('/api/cluster/services/:id/configs', (req, res) => {
  const service = db.cluster.services[req.params.id]
  if (service) res.send(service.toJSON().configs)
  else res.status(404).send()
})

app.post('/api/cluster/services/:id/configs', (req, res) => {
  const service = db.cluster.services[req.params.id]
  if (service) {
    let configs = service.configs
    let config = req.body
    config.id = Object.keys(configs).length + 1
    configs[config.id] = config
    service.connect(configs)
    res.send(service.toJSON().configs[config.id])
  } else {
    res.status(404).send('No such service')
  }
})

app.get('/api/cluster/services/:id/configs/:cid', (req, res) => {
  const service = db.cluster.services[req.params.id]
  if (service) {
    const config = service.toJSON().configs[req.params.cid]
    if (config) res.send(config)
    else res.status(404).send('No such config')
  } else {
    res.status(404).send('No such service')
  }
})

app.post('/api/cluster/services/:id/configs/:cid', (req, res) => {
  const service = db.cluster.services[req.params.id]
  if (service) {
    let config = service.toJSON().configs[req.params.cid]
    if (config) {
      // todo: validate
      config = Object.assign({}, config, req.body)
      config.id = req.params.cid
      service.configs[config.id] = config
      service.connect(service.configs)
      res.send(service.toJSON().configs[config.id])
    } else {
      res.status(404).send('No such config')
    }
  } else {
    res.status(404).send('No such service')
  }
})

app.delete('/api/cluster/services/:id/configs/:cid', (req, res) => {
  const service = db.cluster.services[req.params.id]
  if (service) {
    const config = service.toJSON().configs[req.params.cid]
    if (config) {
      delete service.configs[config.id]
      res.send()
    } else {
      res.status(404).send('No such config')
    }
  } else {
    res.status(404).send('No such service')
  }
})

app.post('/api/cluster/services/:id/configs/:cid/launch', (req, res) => {
  const service = db.cluster.services[req.params.id]
  if (service) {
    const config = service.configs[req.params.cid]
    if (config) {
      if (config.service == 'awsec2') {
        console.log('launching', config)
        awsec2.launch(config)
        res.send()
      } else if (config.service == 'vagrant') {
          console.log('launching', config)
          vagrant.launch(config)
          res.send()
      } else {
        res.status(500).send('Not supported yet')
      }
    } else {
      res.status(404).send('No such config')
    }
  } else {
    res.status(404).send('No such service')
  }
})

app.get('/api/experiments', (req, res) => {
  res.send(db.experiments)
})

app.get('/api/experiments/:id', (req, res) => {
  let exp = db.experiments[req.params.id]
  if (exp) {
    res.send(exp)
  } else {
    res.send(404, 'Not found');
  }
})

app.post('/api/experiments/:id', (req, res) => {
  db.experiments[req.params.id] = req.body
  fs.writeFileSync('../build/db/experiments.json', JSON.stringify(db.experiments, null, 2))
  res.send('ok')
})

app.delete('/api/experiments/:id', (req, res) => {
  if (db.experiments[req.params.id]) {
    delete db.experiments[req.params.id]
    fs.writeFileSync('../build/db/experiments.json', JSON.stringify(db.experiments, null, 2))
    res.send('ok')
  } else {
    res.send(404, 'Not found')
  }
})

app.all('/api/*', (req, res) => {
  res.sendStatus(req.method == 'OPTIONS' ? 200 : 404)
})