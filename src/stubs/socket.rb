class BasicSocket
  def initialize(...)
    raise NotImplementedError, "Socket is not supported in WASM"
  end
  def self.do_not_reverse_lookup=(v)
    v
  end
end

class Socket < BasicSocket
end

class SocketError < StandardError
end

# class IPSocket < Socket; end

# class TCPSocket < Socket; end
