class BasicSocket
  def initialize(...)
    raise NotImplementedError, "Socket is not supported in WASM"
  end
  def self.do_not_reverse_lookup=(v)
    v
  end
end

class Socket < BasicSocket
  AF_UNSPEC = 0
  AF_INET = 2
end

class IPSocket < Socket
  def self.getaddress(*)
    "::1"
  end
end

class TCPSocket < Socket
end

class SocketError < StandardError
end

class IPAddr
  def initialize(addr)
    @addr = addr
  end

  def to_s = @addr
end
