const log = {
  warn: (...msg: any[]) => {
    console.warn('\x1b[33m', ...msg);
  },
  error: (...msg: any[]) => {
    console.error('\x1b[31m', ...msg);
  },
  info: (...msg: any[]) => {
    console.log('\x1b[32m', ...msg);
  },
  success: (...msg: any[]) => {
    console.log('\x1b[34m', ...msg);
  },
}

export default log;