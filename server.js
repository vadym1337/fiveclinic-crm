const express = require('express');
const webpush = require('web-push');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// VAPID keys – vygeneruj si vlastní příkazem: npx web-push generate-vapid-keys
const VAPID_PUBLIC = process.env.VAPID_PUBLIC || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE || 'UUxI4O8-FbRouAevSmBQ6o18hgE4nSG3qwvJTfKc-ls';

webpush.setVapidDetails('mailto:info@fiveclinic.cz', VAPID_PUBLIC, VAPID_PRIVATE);

let subscriptions = [];

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/vapid-public', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC });
});

app.post('/subscribe', (req, res) => {
  const sub = req.body;
  if (!subscriptions.find(s => s.endpoint === sub.endpoint)) {
    subscriptions.push(sub);
  }
  res.status(201).json({ ok: true });
});

app.post('/notify', (req, res) => {
  const payload = JSON.stringify(req.body || { title: 'Five Clinic', body: 'Nová položka k vyřízení' });
  const promises = subscriptions.map(sub =>
    webpush.sendNotification(sub, payload).catch(err => {
      console.error('Push error', err);
      subscriptions = subscriptions.filter(s => s.endpoint !== sub.endpoint);
    })
  );
  Promise.all(promises).then(() => res.json({ ok: true, sent: subscriptions.length }));
});

app.listen(PORT, () => console.log('Running on', PORT));
