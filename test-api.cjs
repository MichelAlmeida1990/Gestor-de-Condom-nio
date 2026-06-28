const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/occurrences',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJhZG1pbkBjb25kby5jb20iLCJyb2xlIjoiYWRtaW4iLCJuYW1lIjoiU8OtZGljbyBBZG1pbiIsImlhdCI6MTcxOTE1NjAwMCwiZXhwIjoxNzE5MjQyNDAwfQ.test'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Resposta da API:');
    console.log(data);
  });
});

req.on('error', (error) => {
  console.error('Erro:', error.message);
});

req.end();
