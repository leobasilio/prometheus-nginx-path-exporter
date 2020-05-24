const express = require('express')
const NginxParser = require('nginxparser')
const { program } = require('commander')

const data = {}

function runServer () {

  const app = express()

  app.use('/metrics', function (req, res) {

    const paths = Object.getOwnPropertyNames(data)

    const output = []

    output.push('# TYPE nginx_http_path_response_time_seconds summary')

    for (const path of paths) {

      const item = data[path]
      const sanePath = path.replace(/"/, '\\"')

      output.push(`nginx_http_path_response_time_seconds_sum{path="${sanePath}"} ${item.sum}`)
      output.push(`nginx_http_path_response_time_seconds_count{path="${sanePath}"} ${item.count}`)

    }

    res.set('Content-Type', 'text/plain')

    /* eslint-disable quotes */
    res.send(output.join("\n"))

  })

  app.listen(9080)

}

function monitorLog (filepath, format) {

  const parser = new NginxParser(format)
  const regex = /^[A-Z]+ (\/[^/ ?#]+(?:\/[^/ ?#]+)?)[/ ?#]/

  parser.read(filepath, { tail: true }, function (line) {

    const requestTime = line.request_time ? parseFloat(line.request_time) : null

    if (requestTime) {

      const match = regex.exec(line.request)

      if (match) {

        const path = match[1].toLowerCase()
        const item = data[path]

        if (!item) {

          data[path] = {
            count: 1,
            sum: requestTime
          }

        } else {

          item.count++
          item.sum += requestTime

        }

      }

    }

  }, function (err) {

    if (err) throw err

  })

}

program
  .version('0.1')
  .requiredOption('-f, --format <format>', 'log_format string')
  .arguments('<logfile>')
  .action(function (logfile) {

    monitorLog(program.format, logfile)

    runServer()

  })
  .parse(process.argv)
