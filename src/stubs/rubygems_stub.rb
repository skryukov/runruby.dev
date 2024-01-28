require "js"
require "base64"
require "rubygems"
require "rubygems/commands/install_command"

Gem::Request.prepend(Module.new do
  def perform_request(request)
    js_response = JS.global.fetch(Gem::Uri.redact(@uri).to_s, {method: request.method}).await
    code = js_response[:status]
    array_buffer = js_response.arrayBuffer.await
    base64_body = JS.global.btoa(JS.global[:String][:fromCharCode].apply(nil, JS.global[:Uint8Array].new(array_buffer))).to_s
    body = Base64.decode64(base64_body)

    response_class = Gem::Net::HTTPResponse::CODE_TO_OBJ[code.to_s]
    http_response = response_class.new("1.1", code, "OK")
    http_response.instance_variable_set(:@read, true)

    js_response[:headers].forEach do |value, name|
      http_response[name.to_s] = value.to_s
    end

    if body
      http_response.instance_variable_set(:@body, body)
    end

    http_response
  end
end)

Gem::Installer.prepend(Module.new do
  # TODO: https://github.com/bjorn3/browser_wasi_shim doesn't support chmod
  def check_that_user_bin_dir_is_in_path = true
  def ensure_writable_dir(*) = true
end)
