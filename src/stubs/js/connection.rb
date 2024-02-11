require "js"
require "base64"
require "json"

class JS::Connection
    MESSAGES = {
      100 => "Continue",
      101 => "Switching Protocols",
      102 => "Processing",
      200 => "OK",
      201 => "Created",
      202 => "Accepted",
      203 => "Non-Authoritative Information",
      204 => "No Content",
      205 => "Reset Content",
      206 => "Partial Content",
      207 => "Multi-Status",
      208 => "Already Reported",
      226 => "IM Used",
      300 => "Multiple Choices",
      301 => "Moved Permanently",
      302 => "Found",
      303 => "See Other",
      304 => "Not Modified",
      305 => "Use Proxy",
      307 => "Temporary Redirect",
      308 => "Permanent Redirect",
      400 => "Bad Request",
      401 => "Unauthorized",
      402 => "Payment Required",
      403 => "Forbidden",
      404 => "Not Found",
      405 => "Method Not Allowed",
      406 => "Not Acceptable",
      407 => "Proxy Authentication Required",
      408 => "Request Timeout",
      409 => "Conflict",
      410 => "Gone",
      411 => "Length Required",
      412 => "Precondition Failed",
      413 => "Payload Too Large",
      414 => "URI Too Long",
      415 => "Unsupported Media Type",
      416 => "Range Not Satisfiable",
      417 => "Expectation Failed",
      421 => "Misdirected Request",
      422 => "Unprocessable Entity",
      423 => "Locked",
      424 => "Failed Dependency",
      426 => "Upgrade Required",
      428 => "Precondition Required",
      429 => "Too Many Requests",
      431 => "Request Header Fields Too Large",
      451 => "Unavailable For Legal Reasons",
      500 => "Internal Server Error",
      501 => "Not Implemented",
      502 => "Bad Gateway",
      503 => "Service Unavailable",
      504 => "Gateway Timeout",
      505 => "HTTP Version Not Supported",
      506 => "Variant Also Negotiates",
      507 => "Insufficient Storage",
      508 => "Loop Detected",
      510 => "Not Extended",
      511 => "Network Authentication Required"
    }.each { |_, v| v.freeze }.freeze

  def proxy_uri(uri)
    if URI(uri.to_s).host.match? /(\A|\.)rubygems.org\z/
      "https://rubygems.runruby.dev/?#{uri.to_s}"
    else
      uri.to_s
    end
  end

  def request(uri, req)
    # see https://github.com/rubygems/rubygems/pull/7352/files
    req["If-None-Match"] = %("#{req["If-None-Match"]}") if req["If-None-Match"] && !req["If-None-Match"].start_with?('"')

    js_response = JS.eval(<<~JS).await
      return fetch('#{proxy_uri(uri)}', {
        method: '#{req.method}',
        headers: #{req.to_hash.transform_values { _1.join(';') }.to_json},
        body: #{req.body ? req.body.to_json : 'undefined'}
      })
      .then(response => {
        if (
          response.headers.get('content-type') === 'binary/octet-stream' ||
          response.headers.get('content-type') === 'application/octet-stream'
        ) {
          return response.arrayBuffer().then(arrayBuffer => {
            const uint8array = new Uint8Array(arrayBuffer);

            return {status: response.status, headers: response.headers, uint8array}
          })
        } else {
          return response.text().then(text => {
            return {status: response.status, headers: response.headers, text}
          })
        }
      })
    JS

    body = js_response[:uint8array].to_s != "undefined" ? js_response[:uint8array][:length].to_i.times.map {js_response[:uint8array].call(:at, _1).to_i}.pack("C*") : js_response[:text].to_s
    status = js_response[:status]
    response_class = defined?(Gem::Net::HTTPResponse::CODE_TO_OBJ) ? Gem::Net::HTTPResponse::CODE_TO_OBJ[status.to_s] : Net::HTTPResponse::CODE_TO_OBJ[status.to_s]
    http_response = response_class.new("1.1", status.to_i, MESSAGES[status.to_i])
    http_response.instance_variable_set(:@read, true)

    js_response[:headers].forEach do |value, name|
      http_response[name.to_s] = value.to_s
    end

    if body
      http_response.instance_variable_set(:@body, body)
    end

    http_response
  end
end
