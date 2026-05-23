function switchScreen(screen) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
}

function calcBalance(cust, txns) {
  let bal = cust.openingBalance || 0;

  if (txns && txns.length > 0) {
    txns.forEach(t => {
      bal += (t.give || 0);
      bal -= (t.receive || 0);
    });
  }

  return bal;
}

function money(v) {
  let parsed = parseFloat(v);

  if (isNaN(parsed)) return "০.০০";

  return parsed.toLocaleString("bn-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatBanglaNumber(num) {
  const engToBn = {
    '0':'০',
    '1':'১',
    '2':'২',
    '3':'৩',
    '4':'৪',
    '5':'৫',
    '6':'৬',
    '7':'৭',
    '8':'৮',
    '9':'৯'
  };

  return String(num)
    .split('')
    .map(d => engToBn[d] || d)
    .join('');
}

function formatDateBangla(d) {
  return d.toLocaleDateString("bn-BD", {
    day:"numeric",
    month:"long",
    year:"numeric"
  });
}

function formatTimeBangla(d) {
  return d.toLocaleTimeString("bn-BD", {
    hour:"2-digit",
    minute:"2-digit",
    hour12:true
  });
}