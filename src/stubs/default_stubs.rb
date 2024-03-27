def Dir.home = "/"

# TODO: implement?
# def Kernel.exec(*attrs)
#   attrs[0] = "/home/runruby#{attrs[0]}" if attrs[0].start_with?("/")
#   JS.eval(<<~CODE)
#     const { exec } = require('child_process');
#     exec(`#{attrs.map(&:to_s).join(' ')}`, (error, stdout, stderr) => {
#       if (stdout) console.log(stdout)
#       if (stderr) console.error(stderr)
#       if (error) {
#           return 1
#       }
#       return 0
#     })
#   CODE
# end
