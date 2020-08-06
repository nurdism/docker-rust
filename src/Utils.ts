export function filter(line: string) {
  return line.trim() !== '' && !line.match(/filename\:/ig)
}

export function parse(str: string): string[] {
  const args = []
  let _r = false
  let _p = ''
  for (let i = 0; i < str.length; i++) {
    if (str.charAt(i) === ' ' && !_r) {
      args.push(_p)
      _p = ''
    } else {
      if (str.charAt(i).match(/\"/)) {
        _r = !_r
      } else {
        _p += str.charAt(i)
      }
    }
  }
  args.push(_p)
  return args
}
