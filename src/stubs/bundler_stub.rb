module OpenSSL::SSL
  class SSLError < StandardError;end
end

# flock is not implemented in the shim
File.prepend(Module.new do
  def flock(*);end
end)

# shim marks all dirs/files as readonly
File.singleton_class.prepend(Module.new do
  def writable?(*) = true
end)

require "bundler"

# Bundler worker uses threads for async requests
# We will do that in sync
require "bundler/worker"
Bundler::Worker.prepend(Module.new do
  def enq(obj)
    @results = [] unless @results
    @results << @func.call(obj, 0)
  end

  def deq
    @results.shift
  end
end)

ENV["BUNDLE_SSL_VERIFY_MODE"] = "0"

require "js/connection"

Bundler::Fetcher.prepend(Module.new do
  def connection
    JS::Connection.new
  end
end)
