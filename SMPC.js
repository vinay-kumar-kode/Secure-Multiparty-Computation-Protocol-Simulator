/**
 * Secure Multiparty Computation Simulator
 * Author: Vinay Kumar Kode
 * Improved version with dynamic flowchart and Chart.js integration.
 */

let steps = [];
let currentStep = 0;
let shamirShares = [];
let additiveShares = [];
let primeMod = 0;
let polynomialCoeffs = [];
let chartInstance = null;

/**
 * Utility: Converts a number to its superscript string representation.
 */
function toSuperscript(num){
  return String(num).replace(/./g, d => {
    const map = { '0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹' };
    return map[d] || d;
  });
}

/**
 * Utility: Modular exponentiation.
 */
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

/**
 * Utility: Modular inverse using Extended Euclidean Algorithm.
 */
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

/**
 * Utility: Primality test.
 */
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

// Event Listeners
document.addEventListener('DOMContentLoaded', () =>{
  setupParties();
  document.addEventListener('keydown', e => {
    if (e.key.toLowerCase() === 's') runSimulation();
    if (e.key.toLowerCase() === 'r') resetSimulation();
    if (e.key.toLowerCase() === 'h') window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

/**
 * UI Setup: Switches inputs based on selected protocol.
 */
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
    document.getElementById('chartCanvas').style.display = 'none';
    document.getElementById('flowchart').style.display = 'block';
  } else {
    container.innerHTML = `
      <div class="mb-3">
        <label for="secretInput" class="form-label">Secret (S)</label>
        <input id="secretInput" type="number" class="form-control" placeholder="Enter secret (integer)">
      </div>
      <div class="mb-3">
        <label for="thresholdInput" class="form-label">Threshold (t)</label>
        <input id="thresholdInput" type="number" class="form-control" placeholder="Min shares to reconstruct">
      </div>
      <div class="mb-3">
        <label for="primeInput" class="form-label">Prime Modulus (p)</label>
        <input id="primeInput" type="number" class="form-control" placeholder="Enter prime > secret">
      </div>
    `;
    document.getElementById('chartCanvas').style.display = 'block';
    document.getElementById('flowchart').style.display = 'none';
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

/**
 * Runner logic for stepping through simulation.
 */
function runSimulation() {
  const protocol = document.getElementById('protocolSelect').value;
  if (steps.length === 0) {
    if (protocol === 'additive') createAdditiveSteps();
    else createShamirSteps();
  }
  if (steps.length === 0) return;
  if (currentStep < steps.length) {
    const stepObj = steps[currentStep];
    appendLine(stepObj.text);
    if (protocol === 'additive') {
      updateFlowchart(stepObj.flowNodes);
    } else {
      if (stepObj.drawChart && chartInstance) {
        // Additional chart interactions can go here
      }
    }
    currentStep++;
    updateProgress();
    if (currentStep === steps.length) {
      showCompleteModal();
      updateStatus('Complete', 'success');
    } else {
      updateStatus(`Step ${currentStep}/${steps.length}`, 'info');
    }
  }
}

/**
 * Appends line to output console.
 */
function appendLine(text) {
  if(!text) return;
  const outputElem = document.getElementById('output');
  const div = document.createElement('div');
  div.className = "mb-2";
  if (text.startsWith("Step")) {
    let stepNum = text.match(/^Step\s+(\d+)/);
    if (stepNum) {
      div.innerHTML = `<span class="badge bg-primary me-2">Step ${stepNum[1]}</span> ${text.replace(/^Step\s+\d+:\s*/, '')}`;
    } else div.textContent = text;
  } else if (text.includes("Reconstructed Secret")) {
    div.innerHTML = `<span class="badge bg-success me-2">Result</span> <strong>${text}</strong>`;
  } else if (text.startsWith("Shamir") || text.startsWith("Additive") || text.startsWith("Secret S") || text.startsWith("Shares:")) {
    div.innerHTML = `<span class="badge bg-info text-dark me-2">Info</span> ${text}`;
  } else {
    div.textContent = text;
  }
  outputElem.appendChild(div);
  outputElem.scrollTop = outputElem.scrollHeight;
}

/**
 * Updates Flowchart for Additive sharing
 */
function updateFlowchart(nodes) {
  if (!nodes || nodes.length === 0) return;
  const flowchartElem = document.getElementById('flowchart');
  flowchartElem.innerHTML = ''; // Re-draw
  nodes.forEach((node, index) => {
    const div = document.createElement('div');
    div.className = 'flow-node ' + (node.type || '');
    div.innerText = node.label;
    flowchartElem.appendChild(div);
    if (index < nodes.length - 1) {
      const arrow = document.createElement('div');
      arrow.className = 'flow-arrow';
      arrow.innerHTML = '&#8594;'; // right arrow
      flowchartElem.appendChild(arrow);
    }
  });
}

/**
 * Pre-computes steps for Additive Sharing
 */
function createAdditiveSteps() {
  const n = Number(document.getElementById('numParties').value);
  const secret = Number(document.getElementById('secretInputAdd').value);
  const prime = Number(document.getElementById('primeInputAdd').value);
  if (isNaN(secret) || isNaN(prime)) { showError('Please enter valid integers.'); return; }
  if (prime <= secret) { showError('Prime must be greater than secret.'); return; }
  if (!isPrime(prime)) { showError(`Prime modulus (${prime}) must be a prime number.`); return; }
  
  additiveShares = [];
  let sum = 0;
  for (let i = 0; i < n - 1; i++){
    let r = Math.floor(Math.random() * prime);
    additiveShares.push(r);
    sum = (sum + r) % prime;
  }
  let lastShare = ((secret - sum) % prime + prime) % prime;
  additiveShares.push(lastShare);
  
  steps = [];
  currentStep = 0;
  
  let currentNodes = [
    { label: `Secret S=${secret}`, type: 'secret' },
    { label: `Distribute Shares`, type: 'active' }
  ];
  
  steps.push({ text: `Additive Sharing (mod ${prime})`, flowNodes: currentNodes });
  steps.push({ text: `Secret S = ${secret}`, flowNodes: currentNodes });
  steps.push({ text: `Shares: ${additiveShares.join(', ')}`, flowNodes: currentNodes });
  steps.push({ text: `Reconstruction begins:`, flowNodes: currentNodes });
  
  let running = 0;
  for (let i = 0; i < n; i++){
    running = (running + additiveShares[i]) % prime;
    currentNodes = [
      { label: `Party ${i+1}\nShare: ${additiveShares[i]}`, type: 'active' },
      { label: `Running Sum\n${running}`, type: '' }
    ];
    steps.push({ text: `Step ${i+1}: Party ${i+1} contributes ${additiveShares[i]} → running sum = ${running} (mod ${prime})`, flowNodes: currentNodes });
  }
  
  currentNodes = [
    { label: `Final Sum\n${running}`, type: 'active' },
    { label: `Modulo ${prime}`, type: '' },
    { label: `Secret S=${running}`, type: 'secret' }
  ];
  steps.push({ text: `Reconstructed Secret = ${running} (mod ${prime})`, flowNodes: currentNodes });
}

/**
 * Pre-computes steps for Shamir Secret Sharing
 */
function createShamirSteps() {
  const n = Number(document.getElementById('numParties').value);
  const secret = Number(document.getElementById('secretInput').value);
  const threshold = Number(document.getElementById('thresholdInput').value);
  primeMod = Number(document.getElementById('primeInput').value);
  
  if (isNaN(secret) || isNaN(threshold) || isNaN(primeMod)) { showError('Please enter valid integers.'); return; }
  if (primeMod <= secret) { showError('Prime must be greater than secret.'); return; }
  if (!isPrime(primeMod)) { showError(`Prime modulus (${primeMod}) must be a prime number.`); return; }
  if (threshold > n) { showError(`Threshold (t=${threshold}) cannot be greater than number of parties (n=${n})`); return;}
  
  polynomialCoeffs = [secret];
  for (let i = 1; i < threshold; i++) {
    polynomialCoeffs.push(Math.floor(Math.random() * (primeMod - 1)) + 1);
  }
  
  shamirShares = [];
  for (let i = 1; i <= n; i++){
    let yi = 0;
    for (let j = 0; j < polynomialCoeffs.length; j++) {
      yi = (yi + polynomialCoeffs[j] * modPow(i, j, primeMod)) % primeMod;
    }
    shamirShares.push({x: i, y: yi});
  }
  
  const selected = shamirShares.slice(0, threshold);
  
  steps = [];
  currentStep = 0;
  steps.push({ text: `Shamir Secret Sharing (mod ${primeMod})` });
  steps.push({ text: `Secret S = ${secret}` });
  steps.push({ text: `Threshold t = ${threshold}` });
  steps.push({ text: `Polynomial f(x) = ${polynomialCoeffs.map((c,i)=>`${c}*x${toSuperscript(i)}`).join(' + ')} (mod ${primeMod})` });
  steps.push({ text: `Shares: ${shamirShares.map(s=>`(x=${s.x}, y=${s.y})`).join(', ')}` });
  
  // Draw initial chart
  drawShamirChart(secret, polynomialCoeffs, shamirShares, primeMod);
  
  steps.push({ text: `Reconstruction using first ${threshold} shares:` });
  
  let partials = [];
  for (let i = 0; i < selected.length; i++){
    const xi = selected[i].x;
    const yi = selected[i].y;
    let Li = 1;
    let pieces = [];
    for (let j = 0; j < selected.length; j++){
      if (j === i) continue;
      const xj = selected[j].x;
      let numer = (0 - xj + primeMod) % primeMod;
      let denom = (xi - xj + primeMod) % primeMod;
      let val = (numer * modInverse(denom, primeMod)) % primeMod;
      Li = (Li * val) % primeMod;
      pieces.push(`${numer}*${denom}⁻¹=${val}`);
    }
    steps.push({ text: `Step ${i+1}: L${i+1}(0) = ${pieces.join(' × ')} mod ${primeMod} = ${Li}` });
    
    let term = (yi * Li) % primeMod;
    partials.push(term);
    steps.push({ text: `Multiply: y${i+1}*L${i+1}(0) = ${yi} * ${Li} mod ${primeMod} = ${term}` });
  }
  
  let running = 0;
  for (let i = 0; i < partials.length; i++){
    running = (running + partials[i]) % primeMod;
    steps.push({ text: `Add term ${i+1}: running sum = ${running}` });
  }
  steps.push({ text: `Reconstructed Secret = ${running} (mod ${primeMod})` });
}

/**
 * Draws Shamir Polynomial Chart using Chart.js
 */
function drawShamirChart(secret, coeffs, shares, p) {
  const ctx = document.getElementById('chartCanvas').getContext('2d');
  if (chartInstance) chartInstance.destroy();
  
  let discreteData = [];
  for (let x = 0; x <= shares.length + 1; x += 0.5) {
      let y = 0;
      for (let j = 0; j < coeffs.length; j++) {
        y = (y + coeffs[j] * modPow(Math.floor(x), j, p)) % p; 
        // For visual line continuity over the real field before mod, we just interpolate
        // But for exact mod p cryptography, the line is just a visual aid.
        y = y; 
      }
  }

  // Purely continuous polynomial over Reals (for beautiful visualization, avoiding mod wrap spikes on lines)
  let continuousData = [];
  for(let x=0; x<= shares.length + 1; x+=0.1) {
    let y = 0;
    for (let j=0; j<coeffs.length; j++) {
        y += coeffs[j] * Math.pow(x, j);
    }
    continuousData.push({x: x, y: y});
  }

  const sharePoints = shares.map(s => ({x: s.x, y: s.y}));
  
  chartInstance = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Shares',
          data: sharePoints,
          backgroundColor: '#ff6384',
          pointRadius: 6,
          pointHoverRadius: 8,
          order: 1
        },
        {
          label: 'Secret (x=0)',
          data: [{x: 0, y: secret}],
          backgroundColor: '#ffce56',
          pointRadius: 8,
          pointStyle: 'star',
          order: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { 
          title: { display: true, text: 'Party ID (x)', color: '#fff' },
          ticks: { color: '#aaa', stepSize: 1 }
        },
        y: { 
          title: { display: true, text: 'Share Value (y)', color: '#fff' },
          ticks: { color: '#aaa' }
        }
      },
      plugins: {
        legend: { labels: { color: '#fff' } },
        tooltip: {
            callbacks: {
                label: function(ctx) {
                    return `(x=${ctx.raw.x}, y=${ctx.raw.y})`;
                }
            }
        }
      }
    }
  });
}

/**
 * Resets the simulation UI and state.
 */
function resetSimulation(){
  document.getElementById('output').innerHTML = '';
  document.getElementById('computeBtn').disabled = true;
  if(chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  document.getElementById('flowchart').innerHTML = '';
  setupParties();
}

/**
 * Resets memory state.
 */
function resetSimulationSteps(){
  steps = []; 
  currentStep = 0; 
  shamirShares=[]; 
  additiveShares=[]; 
  primeMod=0;
  polynomialCoeffs=[];
  updateProgress();
}

/**
 * Updates progress bar.
 */
function updateProgress(){
  const total = steps.length || 1;
  const pct = Math.min(100, Math.round((currentStep/total)*100));
  const bar = document.getElementById('progressBar');
  bar.style.width = pct+'%';
  bar.textContent = pct+'%';
}

/**
 * Show info modal.
 */
function showHowItWorks() {
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <p>Secure MPC Simulator supports:</p>
    <ul>
      <li><b>Additive Secret Sharing</b>: Random shares modulo prime, step-by-step reconstruction. Visualized with flow nodes.</li>
      <li><b>Shamir Secret Sharing</b>: Threshold sharing with polynomials and Lagrange reconstruction. Visualized with interactive Chart.js graphs.</li>
    </ul>
    <p>Press <b>S</b> to step through the math logic, or <b>R</b> to reset.</p>
  `;
  document.querySelector('#completeModal .modal-footer').style.display = 'none';
  new bootstrap.Modal(document.getElementById('completeModal')).show();
}

/**
 * Renders an error on the screen.
 */
function showError(msg){
  const out = document.getElementById('output');
  out.innerHTML = `<div class="text-danger"><strong>ERROR:</strong> ${msg}</div>`;
  updateStatus('Error','error');
  document.getElementById('computeBtn').disabled = true;
  resetSimulationSteps();
}

/**
 * Final step modal completion.
 */
function showCompleteModal(){
  const modalEl = document.getElementById('completeModal');
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `<div class="alert alert-success">
      <h4 class="alert-heading">Simulation Complete!</h4>
      <p>The secret has been successfully reconstructed securely.</p>
      <hr>
      <p class="mb-0">You can scroll through the output panel to review the step-by-step modular arithmetic logic.</p>
  </div>`;
  document.querySelector('#completeModal .modal-footer').style.display = 'flex';
  new bootstrap.Modal(modalEl).show();
}
