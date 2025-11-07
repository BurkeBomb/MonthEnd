async function saveMatchAndEmail(payment, bankTx, clientEmail) {
  const invoiceHtml = `
    <h1>Invoice</h1>
    <p><strong>Payer:</strong> ${payment.description}</p>
    <p><strong>Amount:</strong> ${payment.amount}</p>
    <p><strong>Date:</strong> ${new Date(payment.date).toLocaleDateString()}</p>
    <p><strong>Reference:</strong> ${bankTx.reference || 'N/A'}</p>
  `;

  try {
    const res = await fetch('http://localhost:4000/api/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentId: payment.id,
        bankTxId: bankTx.id,
        amount: payment.amount,
        clientEmail,
        invoiceHtml
      })
    });

    const json = await res.json();
    if (json.success) {
      alert(`Invoice sent to ${clientEmail} ✅`);
    } else {
      alert(`❌ Error: ${json.error}`);
    }
  } catch (err) {
    alert(`❌ Failed to connect to backend: ${err.message}`);
  }
}
