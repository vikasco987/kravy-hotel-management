const tls = require('tls');
const options = {
  host: 'ac-uxzes9b-shard-00-00.2d52zlp.mongodb.net',
  port: 27017,
  servername: 'ac-uxzes9b-shard-00-00.2d52zlp.mongodb.net' // SNI is required by Atlas
};

const socket = tls.connect(options, () => {
  console.log('client connected', socket.authorized ? 'authorized' : 'unauthorized');
  socket.end();
});

socket.on('error', (error) => {
  console.error('TLS error:', error);
});
