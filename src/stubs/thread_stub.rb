class Thread
  class Result
    attr_reader :value

    def initialize(value)
      @value = value
    end
  end

  def self.new(&block)
    warn "Thread.new executed synchronously"
    Result.new(yield)
  end
end
