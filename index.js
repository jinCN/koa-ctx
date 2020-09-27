const { AsyncLocalStorage } = require('async_hooks')
const asyncLocalStorage = new AsyncLocalStorage()
const uses = []

async function ctxMiddleware (ctx, next) {
  const store = { ctx }
  asyncLocalStorage.run(store, async () => {
    for (const use of uses) {
      const ret = use()
      if (ret instanceof Promise) {
        await ret
      }
    }
    await next()
  })
}

ctxMiddleware.use = (fn) => {
  if (typeof fn !== 'function') {
    throw new Error('use(fn) fn must provide a function')
  }
  uses.push(fn)
}

const toDefine = [
  'getPrototypeOf',
  'setPrototypeOf',
  'isExtensible',
  'preventExtensions',
  'getOwnPropertyDescriptor',
  'has',
  'get',
  'set',
  'deleteProperty',
  'defineProperty',
  'enumerate',
  'ownKeys',
  'apply',
  'construct'
]
const handler = {}
for (const item of toDefine) {
  handler[item] = (...args) => {
    let store = asyncLocalStorage.getStore()
    if (!store) store = {}
    args[0] = store
    return Reflect[item](...args)
  }
}
const context = new Proxy({}, handler)

module.exports = { ctxMiddleware, context }
