const { hashPassword } = require('../server/auth');
// Read from stdin without echoing the password; use `read -rs` as documented.
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  const password = input.replace(/\r?\n$/, '');
  if (password.length < 16 || password.length > 1024) { console.error('Use de 16 a 1024 caracteres.'); process.exitCode = 1; return; }
  console.log(hashPassword(password));
});
