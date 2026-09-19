const SERVICE = '7d9b0001-6d8f-4f5a-9a42-4a2b1aee1000';
const COMMAND = '7d9b0002-6d8f-4f5a-9a42-4a2b1aee1000';
const RESPONSE = '7d9b0003-6d8f-4f5a-9a42-4a2b1aee1000';
let commandChar, responseChar;
const encoder = new TextEncoder(), decoder = new TextDecoder();
const $ = id => document.getElementById(id);

function show(message) { $('status').textContent = message; }
async function connect() {
  try {
    show('Choose SG-SoundPlayer…');
    const device = await navigator.bluetooth.requestDevice({filters:[{services:[SERVICE]}]});
    device.addEventListener('gattserverdisconnected', () => { show('Disconnected'); $('controls').hidden=true; });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(SERVICE);
    commandChar = await service.getCharacteristic(COMMAND);
    responseChar = await service.getCharacteristic(RESPONSE);
    $('controls').hidden = false;
    show('Connected to ' + device.name);
    const state = await send({cmd:'status'});
    $('volume').value = state.volume ?? 50;
    $('volumeValue').value = `${state.volume ?? 50}%`;
    $('pir').checked = !!state.pir;
    if (state.ip) $('wifiResult').textContent = `Wi-Fi connected: ${state.ip}`;
  } catch (error) { show(error.message); }
}
async function readResponse() {
  const value = await responseChar.readValue();
  return JSON.parse(decoder.decode(value));
}
async function send(data, wait=true) {
  await commandChar.writeValueWithResponse(encoder.encode(JSON.stringify(data)));
  if (!wait) return {};
  for (let count=0; count<90; count++) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const reply = await readResponse();
    if (reply.status !== 'working' && reply.status !== 'connecting') {
      if (!reply.ok) throw new Error(reply.message || 'Command failed');
      return reply;
    }
  }
  throw new Error('The Pi did not respond in time');
}

$('connect').onclick = connect;
document.querySelectorAll('[data-sound]').forEach(button => button.onclick = async () => {
  try { await send({cmd:'play', sound:Number(button.dataset.sound)}); show(`Playing ${button.textContent}`); }
  catch (error) { show(error.message); }
});
$('volume').onchange = async event => {
  try { const reply=await send({cmd:'volume', value:Number(event.target.value)}); $('volumeValue').value=`${reply.volume}%`; }
  catch (error) { show(error.message); }
};
$('pir').onchange = async event => {
  try { await send({cmd:'pir', enabled:event.target.checked}); }
  catch (error) { show(error.message); }
};
$('scan').onclick = async () => {
  try {
    $('wifiResult').textContent='Scanning…';
    const reply=await send({cmd:'scan_wifi'});
    $('ssid').innerHTML='<option value="">Select a network</option>';
    reply.networks.forEach(network => {
      const option=document.createElement('option'); option.value=network.ssid;
      option.textContent=`${network.ssid} — ${network.signal}%${network.secure?' 🔒':''}`; $('ssid').append(option);
    });
    $('wifiResult').textContent=`Found ${reply.networks.length} networks`;
  } catch(error) { $('wifiResult').textContent=error.message; }
};
$('join').onclick = async () => {
  const ssid=$('ssid').value;
  if (!ssid) { $('wifiResult').textContent='Select a network first'; return; }
  try {
    $('wifiResult').textContent='Connecting…';
    const reply=await send({cmd:'connect_wifi', ssid, password:$('password').value});
    $('wifiResult').textContent=`Connected. Pi address: ${reply.ip || 'assigned by router'}`;
  } catch(error) { $('wifiResult').textContent=error.message; }
};
if ('serviceWorker' in navigator) navigator.serviceWorker.register('service-worker.js');
