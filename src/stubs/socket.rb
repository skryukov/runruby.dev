class Socket
  class << self
    def method_missing(*) = nil
  end
end

class SocketError < StandardError
end
