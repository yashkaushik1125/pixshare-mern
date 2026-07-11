(async()=>{
  try {
    const login = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'broker1@demo.app', password: 'broker123' }),
    });
    const lj = await login.json();
    if (!lj.token) return console.error('login failed', lj);
    const token = lj.token;
    const list = await fetch('http://localhost:4000/api/listings', { headers: { Authorization: 'Bearer ' + token } });
    const data = await list.json();
    console.log('count', data.length);
    console.log(JSON.stringify(data.slice(0,3), null, 2));
  } catch (err) {
    console.error(err);
  }
})();
