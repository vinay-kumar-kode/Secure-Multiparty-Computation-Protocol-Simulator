let steps = [];
let currentStep = 0;
let shamirShares = [];
let additiveShares = [];
let primeMod = 0;
function toSuperscript(num){
  return String(num).replace(/./g, d => {
    const map = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' };
    return map[d] || d;
  });
}
function modPow(base, exp, mod){
  let result = 1;
  base = base % mod;
  while (exp > 0) {
    if (exp % 2 === 1) result = (result * base) % mod;
    base = (base * base) % mod;
    exp = Math.floor(exp / 2);
  }
  return result;
}
function modInverse(a, m){
  let m0 = m, x0 = 0, x1 = 1;
  if (m === 1) return 0;
  a = ((a % m) + m) % m;
  while (a > 1) {
    let q = Math.floor(a / m);
    [a, m] = [m, a % m];
    [x0, x1] = [x1 - q * x0, x0];
  }
  if (x1 < 0) x1 += m0;
  return x1;
}
function isPrime(n){
  if (n < 2) return false;
  if (n === 2 || n === 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  const sqrtN = Math.floor(Math.sqrt(n));
  for (let i = 5; i <= sqrtN; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}
document.addEventListener('DOMContentLoaded', () =>{
  setupParties();
  document.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 's') runSimulation();
    if (e.key.toLowerCase() === 'r') resetSimulation();
    if (e.key.toLowerCase() === 'h') window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
function setupParties() {
  const num = Number(document.getElementById('numParties').value) || 2;
  const container = document.getElementById('partyInputs');
  container.innerHTML = '';
  if (num < 2) {
    container.innerHTML = `<div class="alert alert-warning small">Minimum 2 parties required</div>`;
    document.getElementById('computeBtn').disabled = true;
    return;
  }
  const protocol = document.getElementById('protocolSelect').value;
  if (protocol === 'additive') {
    container.innerHTML = `
      <div class="mb-3">
        <label for="secretInputAdd" class="form-label">Secret (S)</label>
        <input id="secretInputAdd" type="number" class="form-control" placeholder="Enter secret (integer)">
      </div>
      <div class="mb-3">
        <label for="primeInputAdd" class="form-label">Prime Modulus (p)</label>
        <input id="primeInputAdd" type="number" class="form-control" placeholder="Enter prime > secret">
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="mb-3">
        <label for="secretInput" class="form-label">Secret (S)</label>
        <input id="secretInput" type="number" class="form-control" placeholder="Enter secret (integer)">
      </div>
      <div class="mb-3">
        <label for="thresholdInput" class="form-label">Threshold (t)</label>
        <input id="thresholdInput" type="number" class="form-control" placeholder="Minimum shares needed to reconstruct">
      </div>
      <div class="mb-3">
        <label for="primeInput" class="form-label">Prime Modulus (p)</label>
        <input id="primeInput" type="number" class="form-control" placeholder="Enter prime > secret">
      </div>
    `;
  }
  document.getElementById('computeBtn').disabled = false;
  resetSimulationSteps();
  updateStatus('Ready');
}
function updateStatus(text, variant='info') {
  const badge = document.getElementById('statusBadge');
  badge.textContent = text;
  badge.className = 'badge bg-' + (variant==='info' ? 'info text-dark' : variant==='error' ? 'danger' : 'success');
}
function runSimulation() {
  const protocol = document.getElementById('protocolSelect').value;
  if (steps.length === 0) {
    if (protocol === 'additive') createAdditiveSteps();
    else createShamirSteps();
  }
  if (steps.length === 0) return;
  if (currentStep < steps.length) {
    appendLine(steps[currentStep]);
    currentStep++;
    updateProgress();
    if (currentStep === steps.length) {
      showCompleteModal();
      updateStatus('Complete','success');
    } else {
      updateStatus(`Step ${currentStep}/${steps.length}`,'info');
    }
  }
}
function appendLine(text) {
  const outputElem = document.getElementById('output');
  const div = document.createElement('div');
  div.className = "mb-2";
  if (text.startsWith("Step")) {
    let stepNum = text.match(/^Step\s+(\d+)/);
    if (stepNum) {
      div.innerHTML = `<span class="badge bg-primary me-2">Step ${stepNum[1]}</span> ${text.replace(/^Step\s+\d+:\s*/, '')}`;
    } else div.textContent = text;
  } else if (text.includes("Reconstructed Secret")) {
    div.innerHTML = `<span class="badge bg-success me-2">Result</span> ${text}`;
  } else if (text.startsWith("Shamir") || text.startsWith("Additive") || text.startsWith("Secret S") || text.startsWith("Shares:")) {
    div.innerHTML = `<span class="badge bg-info text-dark me-2">Info</span> ${text}`;
  } else {
    div.textContent = text;
  }
  outputElem.appendChild(div);
  outputElem.scrollTop = outputElem.scrollHeight;
}
function createAdditiveSteps() {
  const n = Number(document.getElementById('numParties').value);
  const secret = Number(document.getElementById('secretInputAdd').value);
  const prime = Number(document.getElementById('primeInputAdd').value);
  if (prime <= secret) { showError('Prime must be greater than secret.'); return; }
  if (!isPrime(prime)) { showError(`Prime modulus (${prime}) must be a prime number.`); return; }
  additiveShares = [];
  let sum = 0;
  for (let i=0;i<n-1;i++){
    let r = Math.floor(Math.random() * prime);
    additiveShares.push(r);
    sum = (sum + r) % prime;
  }
  let lastShare = ((secret - sum) % prime + prime) % prime;
  additiveShares.push(lastShare);
  steps = [];
  currentStep = 0;
  steps.push(`Additive Sharing (mod ${prime})`);
  steps.push(`Secret S = ${secret}`);
  steps.push(`Shares: ${additiveShares.join(', ')}`);
  steps.push(`Reconstruction begins:`);
  let running = 0;
  for (let i=0;i<n;i++){
    running = (running + additiveShares[i]) % prime;
    steps.push(`Step ${i+1}: Party ${i+1} contributes ${additiveShares[i]} → running sum = ${running} (mod ${prime})`);
  }
  steps.push(`Reconstructed Secret = ${running} (mod ${prime})`);
}
function createShamirSteps() {
  const n = Number(document.getElementById('numParties').value);
  const secret = Number(document.getElementById('secretInput').value);
  const threshold = Number(document.getElementById('thresholdInput').value);
  primeMod = Number(document.getElementById('primeInput').value);
  if (primeMod <= secret) { showError('Prime must be greater than secret.'); return; }
  if (!isPrime(primeMod)) { showError(`Prime modulus (${primeMod}) must be a prime number.`); return; }
  if (threshold > n) { showError(`Threshold (t=${threshold}) cannot be greater than number of parties (n=${n})`); return;}
  let coeffs = [secret];
  for (let i=1;i<threshold;i++) coeffs.push(Math.floor(Math.random() * (primeMod-1)) + 1);
  shamirShares = [];
  for (let i=1;i<=n;i++){
    let yi = 0;
    for (let j=0;j<coeffs.length;j++) yi = (yi + coeffs[j] * modPow(i,j,primeMod)) % primeMod;
    shamirShares.push({x:i,y:yi});
  }
  const selected = shamirShares.slice(0, threshold);
  steps = [];
  currentStep = 0;
  steps.push(`Shamir Secret Sharing (mod ${primeMod})`);
  steps.push(`Secret S = ${secret}`);
  steps.push(`Threshold t = ${threshold}`);
  steps.push(`Polynomial f(x) = ${coeffs.map((c,i)=>`${c}*x${toSuperscript(i)}`).join(' + ')} (mod ${primeMod})`);
  steps.push(`Shares: ${shamirShares.map(s=>`(x=${s.x}, y=${s.y})`).join(', ')}`);
  steps.push(`Reconstruction:`);
  let partials = [];
  for (let i=0;i<selected.length;i++){
    const xi = selected[i].x;
    const yi = selected[i].y;
    let Li = 1;
    let pieces = [];
    for (let j=0;j<selected.length;j++){
      if (j===i) continue;
      const xj = selected[j].x;
      let numer = (0 - xj + primeMod) % primeMod;
      let denom = (xi - xj + primeMod) % primeMod;
      let val = (numer * modInverse(denom, primeMod)) % primeMod;
      Li = (Li * val) % primeMod;
      pieces.push(`${numer}*${denom}⁻¹=${val}`);
    }
    steps.push(`Step ${i+1}: L${i+1}(0) = ${pieces.join(' × ')} mod ${primeMod} = ${Li}`);
    let term = (yi * Li) % primeMod;
    partials.push(term);
    steps.push(`Multiply: yi*L${i+1} = ${yi} * ${Li} mod ${primeMod} = ${term}`);
  }
  let running = 0;
  for (let i=0;i<partials.length;i++){
    running = (running + partials[i]) % primeMod;
    steps.push(`Add term ${i+1}: running sum = ${running}`);
  }
  steps.push(`Reconstructed Secret = ${running} (mod ${primeMod})`);
}
function resetSimulation(){
  document.getElementById('output').innerHTML = '';
  document.getElementById('computeBtn').disabled = true;
  setupParties();
}
function resetSimulationSteps(){
  steps = []; currentStep = 0; shamirShares=[]; additiveShares=[]; primeMod=0;
}
function updateProgress(){
  const total = steps.length || 1;
  const pct = Math.min(100, Math.round((currentStep/total)*100));
  const bar = document.getElementById('progressBar');
  bar.style.width = pct+'%';
  bar.textContent = pct+'%';
}
function showHowItWorks() {
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <p>Secure MPC Simulator supports:</p>
    <ul>
      <li><b>Additive Secret Sharing</b>: Random shares modulo prime, step-by-step reconstruction.</li>
      <li><b>Shamir Secret Sharing</b>: Threshold sharing with polynomials and Lagrange reconstruction.</li>
    </ul>
  `;
  document.querySelector('#completeModal .modal-footer').style.display = 'none';
  new bootstrap.Modal(document.getElementById('completeModal')).show();
}
function showError(msg){
  const out = document.getElementById('output');
  out.innerHTML = `<div class="text-danger">ERROR: ${msg}</div>`;
  updateStatus('Error','error');
  document.getElementById('computeBtn').disabled = true;
  resetSimulationSteps();
}
function showCompleteModal(){
  const modalEl = document.getElementById('completeModal');
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = document.getElementById('output').innerHTML;
  document.querySelector('#completeModal .modal-footer').style.display = 'flex';
  new bootstrap.Modal(modalEl).show();
}
