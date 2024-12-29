const fs = require('fs');

function Router(req, res, next) {
  const router = RouterMap[req.url];
  if (router) {
    router(req, res, next);
  }
  next();
}

const RouterMap = {
  '/api/msa': (req, res) => {
    const content = fs.readFileSync('./demo/msa.yml', 'utf8');
    res.json({
        code: 200,
        data: {
          content
        }
    })
  }
}

module.exports = Router;