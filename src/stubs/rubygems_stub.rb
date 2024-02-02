require "rubygems"
require "rubygems/commands/install_command"
require "js/connection"

Gem::Request.prepend(Module.new do
  def perform_request(request)
    JS::Connection.new.request(Gem::Uri.redact(@uri).to_s, request)
  end
end)

Gem::Installer.prepend(Module.new do
  # TODO: https://github.com/bjorn3/browser_wasi_shim doesn't support chmod
  def check_that_user_bin_dir_is_in_path = true
  def ensure_writable_dir(*) = true
  def generate_bin_script(*) = true
end)
