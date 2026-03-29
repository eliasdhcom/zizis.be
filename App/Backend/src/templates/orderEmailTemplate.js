/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/03/2026
**/

module.exports = function getOrderEmailTemplate(customerName, orderItems, orderTotal, sessionId, customerAddress) {
    const itemsHtml = orderItems.map(item => `
        <tr>
            <td style="padding: 14px 12px; border-bottom: 1px solid rgba(53, 171, 23, 0.1);">
                <strong style="color: #1a1a1a;">${item.name}</strong>
            </td>
            <td style="padding: 14px 12px; border-bottom: 1px solid rgba(53, 171, 23, 0.1); text-align: center; color: #666;">
                ${item.quantity}x
            </td>
            <td style="padding: 14px 12px; border-bottom: 1px solid rgba(53, 171, 23, 0.1); text-align: right; font-weight: 600; color: #35ab17;">
                €${item.price.toFixed(2)}
            </td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    background-color: #f5f5f3;
                    color: #1a1a1a;
                    line-height: 1.6;
                }
                .container {
                    max-width: 600px;
                    margin: 20px auto;
                    background-color: #ffffff;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 8px 24px rgba(53, 171, 23, 0.12);
                }
                .header {
                    background: linear-gradient(135deg, #35ab17 0%, #2d8a14 100%);
                    padding: 40px 30px;
                    text-align: center;
                    color: white;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                }
                .content {
                    padding: 40px 30px;
                    margin: 0;
                }
                .greeting {
                    font-size: 15px;
                    color: #1a1a1a;
                    margin-bottom: 25px;
                    line-height: 1.7;
                }
                .section {
                    margin: 35px 0;
                }
                .section h2 {
                    font-size: 15px;
                    font-weight: 700;
                    color: #1a1a1a;
                    border-bottom: 3px solid #35ab17;
                    padding-bottom: 12px;
                    margin-bottom: 20px;
                    letter-spacing: 0.5px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                thead tr {
                    background-color: rgba(53, 171, 23, 0.06);
                }
                th {
                    padding: 14px 12px;
                    text-align: left;
                    font-weight: 700;
                    color: #35ab17;
                    border-bottom: 2px solid #35ab17;
                    font-size: 14px;
                }
                th:text-align-center {
                    text-align: center;
                }
                th:text-align-right {
                    text-align: right;
                }
                .info-box {
                    background-color: rgba(53, 171, 23, 0.08);
                    padding: 20px;
                    border-left: 4px solid #35ab17;
                    margin: 20px 0;
                    border-radius: 8px;
                }
                .info-box p {
                    margin: 10px 0;
                    color: #1a1a1a;
                    font-size: 14px;
                }
                .label {
                    font-weight: 700;
                    color: #35ab17;
                    display: inline-block;
                    width: 140px;
                }
                .total-row td {
                    padding: 18px 12px;
                    border-top: 2px solid #35ab17;
                }
                .total-row td:last-child {
                    font-size: 18px;
                    font-weight: 800;
                    color: #35ab17;
                    text-align: right;
                }
                .footer {
                    margin-top: 40px;
                    padding: 25px 30px;
                    border-top: 1px solid rgba(53, 171, 23, 0.1);
                    text-align: center;
                    background-color: #f9f9f8;
                }
                .footer p {
                    color: #999;
                    font-size: 12px;
                    margin: 5px 0;
                    line-height: 1.5;
                }
                .cta {
                    display: inline-block;
                    background: linear-gradient(135deg, #35ab17 0%, #2d8a14 100%);
                    color: white;
                    padding: 14px 30px;
                    text-decoration: none;
                    border-radius: 8px;
                    margin: 20px 0;
                    font-weight: 700;
                    font-size: 14px;
                    transition: all 0.3s ease;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✓ Bestelling Bevestigd</h1>
                </div>

                <div class="content">
                    <div class="greeting">
                        Hallo <strong>${customerName}</strong>,<br><br>
                        Dank je voor je bestelling! We hebben je betaling met succes ontvangen.
                    </div>

                    <div class="section">
                        <h2>📦 Bestelgegevens</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th style="text-align: left;">Product</th>
                                    <th style="text-align: center;">Hoeveelheid</th>
                                    <th style="text-align: right;">Prijs</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                                <tr class="total-row">
                                    <td colspan="2" style="text-align: right; font-weight: 700; color: #1a1a1a;">Totaal:</td>
                                    <td>€${orderTotal.toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="section">
                        <h2>🏪 Afhaling</h2>
                        <div class="info-box">
                            <p>Je bestelling wordt klaargemaakt en staat op het volgende adres klaar voor afhaling:</p>
                            <p style="margin-top: 15px; font-weight: 700; color: #1a1a1a;">
                                Zizis Kapsalon<br>
                                ${customerAddress ? customerAddress + '<br>' : ''}
                                <em style="color: #999; font-style: italic;">${new Date().toLocaleDateString('nl-NL')}</em>
                            </p>
                        </div>
                    </div>

                    <div class="section">
                        <h2>📋 Bestelreferentie</h2>
                        <div class="info-box">
                            <p><span class="label">Session ID:</span> <code style="background-color: rgba(53, 171, 23, 0.15); padding: 4px 8px; border-radius: 4px; font-family: monospace; color: #1a1a1a;">${sessionId}</code></p>
                        </div>
                    </div>

                    <p style="margin-top: 30px; color: #666; font-size: 14px;">
                        Als je vragen hebt, neem dan contact op met onze winkel.
                    </p>
                </div>

                <div class="footer">
                    <p>© ${new Date().getFullYear()} Zizis. Alle rechten voorbehouden.</p>
                    <p>Dit is een automatisch bericht, antwoord alstublieft niet op dit e-mailbericht.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};