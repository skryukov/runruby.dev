require "js"
require "base64"
require "rubygems"
require "rubygems/commands/install_command"

Gem::Request.prepend(Module.new do
  def perform_request(request)
    js_response = JS.eval(<<~JS).await
      // Fixes maximum call stack size exceeded
      function _arrayBufferToBase64(buffer) {
        let result = '';
        (new Uint8Array(buffer)).forEach((b) => result += String.fromCharCode(b));
        return btoa(result);
      }

      return fetch(
        `https://rubygems-cors-proxy.sgkryukov.workers.dev/?#{Gem::Uri.redact(@uri).to_s}`,
        {method: '#{request.method}'}
      ).then(response => {
        return response.arrayBuffer().then(arrayBuffer => {
          const base64 = _arrayBufferToBase64(arrayBuffer)
          return {status: response.status, headers: response.headers, base64}
        })
      })
    JS

    body = Base64.decode64(js_response[:base64].to_s)
    status = js_response[:status]

    response_class = Gem::Net::HTTPResponse::CODE_TO_OBJ[status.to_s]
    http_response = response_class.new("1.1", status, "OK")
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
  def generate_bin_script(*) = true
end)
