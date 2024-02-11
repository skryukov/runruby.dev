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

ENV["BUNDLE_SSL_VERIFY_MODE"] = "0"
ENV["BUNDLE_SILENCE_ROOT_WARNING"] = "1"

require "bundler"

# Bundler worker uses threads for async requests
# We will do that in sync
require "bundler/worker"
Bundler::Worker.prepend(Module.new do
  def enq(obj)
    @results = [] unless @results
    @results << apply_func(obj, 0)
  end

  def deq
    @results.shift
  end
end)

require "bundler/fetcher/compact_index"
Bundler::Fetcher::CompactIndex.prepend(Module.new do
 def specs(gem_names)
   uri = "https://rubygems.runruby.dev/compact_index_specs?gems=#{gem_names.join(',')}"
   response = JSON.parse(JS::Connection.new.request(URI(uri), Gem::Net::HTTP::Get.new(URI(uri))).body)
   if response["remainingGems"].empty?
     response["specs"]
   else
     response["specs"] + specs(response["remainingGems"])
   end
 end

  def available?
    true
  end
end)

require "js/connection"

Bundler::Fetcher.prepend(Module.new do
  def connection
    JS::Connection.new
  end
end)
