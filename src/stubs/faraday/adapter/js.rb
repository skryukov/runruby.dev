require "js/connection"
require "faraday"

class Faraday::Adapter::JS < Faraday::Adapter
  def call(env)
    super

    response = ::JS::Connection.new.request(env[:url].to_s, create_request(env))
    save_response(env, response.code.to_i, response.body) do |response_headers|
      response.each_header do |key, value|
        response_headers[key] = value
      end
    end
  end

  def create_request(env)
    request = Net::HTTPGenericRequest.new(
      env[:method].to_s.upcase, # request method
      !!env[:body], # is there request body
      env[:method] != :head, # is there response body
      env[:url].request_uri, # request uri path
      env[:request_headers] # request headers
    )

    if env[:body].respond_to?(:read)
      request.body_stream = env[:body]
    else
      request.body = env[:body]
    end
    request
  end
end

Faraday::Adapter.register_middleware(js: Faraday::Adapter::JS)
