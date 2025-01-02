const fs = require('fs');

function Router(req, res, next) {
  const router = RouterMap[req.path];
  if (router) {
    router(req, res, next);
  }
  next();
}


const RouterMap = {
  '/api/msa': (req, res) => {
    const filePath = req.query.filePath;
    const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
    res.json({
        code: 200,
        data: {
          content
        }
    })
  }
}

module.exports = Router;