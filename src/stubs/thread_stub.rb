class Thread
  class Result
    attr_reader :value

    def initialize(value)
      @value = value
    end
  end

  class << self
    def new(&block)
      warn "Thread.new executed synchronously"
      Result.new(yield)
    end

    alias_method :start, :new
    alias_method :fork, :new
  end
end
