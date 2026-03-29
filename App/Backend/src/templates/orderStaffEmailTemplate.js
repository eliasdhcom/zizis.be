/**
    * @author EliasDH Team
    * @see https://eliasdh.com
    * @since 29/03/2026
**/

module.exports = function getOrderStaffEmailTemplate(customerName, customerEmail, customerPhone, customerAddress, orderItems, orderTotal, sessionId) {
    const itemsHtml = orderItems.map(item => `
        <tr>
            <td style="padding: 14px 12px; border-bottom: 1px solid rgba(53, 171, 23, 0.1);">
                ${item.name}
            </td>
            <td style="padding: 14px 12px; border-bottom: 1px solid rgba(53, 171, 23, 0.1); text-align: center; color: #666;">
                ${item.quantity}x
            </td>
            <td style="padding: 14px 12px; border-bottom: 1px solid rgba(53, 171, 23, 0.1); text-align: right; font-weight: 600; color: #35ab17;">
                €${(item.price * item.quantity).toFixed(2)}
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
                    max-width: 700px;
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
                .alert-box {
                    background-color: rgba(53, 171, 23, 0.12);
                    border-left: 4px solid #35ab17;
                    padding: 18px 20px;
                    margin: 20px 30px 0 30px;
                    border-radius: 8px;
                    color: #1a1a1a;
                    font-weight: 600;
                }
                .content {
                    padding: 30px;
                }
                .section {
                    margin: 30px 0;
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
                .info-row {
                    margin: 12px 0;
                    padding: 10px 0;
                    border-bottom: 1px solid rgba(53, 171, 23, 0.08);
                }
                .label {
                    font-weight: 700;
                    color: #35ab17;
                    display: inline-block;
                    width: 150px;
                }
                .value {
                    color: #1a1a1a;
                    font-weight: 500;
                }
                .total-row {
                    font-size: 16px;
                    font-weight: 800;
                    color: white;
                    text-align: right;
                    padding: 18px 12px;
                    background: linear-gradient(135deg, #35ab17 0%, #2d8a14 100%);
                    border-radius: 8px;
                    margin-top: 15px;
                }
                .reference-box {
                    background-color: rgba(53, 171, 23, 0.08);
                    padding: 15px 18px;
                    border-radius: 8px;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                    color: #35ab17;
                    word-break: break-all;
                    border: 1px solid rgba(53, 171, 23, 0.2);
                }
                .action-text {
                    margin-top: 25px;
                    padding: 20px;
                    background-color: rgba(53, 171, 23, 0.08);
                    border-left: 4px solid #35ab17;
                    border-radius: 8px;
                    color: #1a1a1a;
                    font-weight: 600;
                    line-height: 1.6;
                }
                .footer {
                    margin-top: 30px;
                    padding: 25px 30px;
                    border-top: 1px solid rgba(53, 171, 23, 0.1);
                    text-align: center;
                    background-color: #f9f9f8;
                }
                .footer p {
                    color: #999;
                    font-size: 12px;
                    margin: 5px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📦 Nieuwe Bestelling Ontvangen</h1>
                </div>

                <div class="alert-box">
                    ⚠️ ACTIE VEREIST: Deze bestelling moet klaargemaakt worden voor afhaling!
                </div>

                <div class="content">
                    <div class="section">
                        <h2>👥 Klantgegevens</h2>
                        <div class="info-row">
                            <span class="label">Naam:</span>
                            <span class="value">${customerName}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Email:</span>
                            <span class="value">${customerEmail}</span>
                        </div>
                        ${customerPhone ? `
                        <div class="info-row">
                            <span class="label">Telefoon:</span>
                            <span class="value">${customerPhone}</span>
                        </div>
                        ` : ''}
                        ${customerAddress ? `
                        <div class="info-row">
                            <span class="label">Afhaaladres:</span>
                            <span class="value">${customerAddress}</span>
                        </div>
                        ` : ''}
                    </div>

                    <div class="section">
                        <h2>📥 Bestelde Producten</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th style="text-align: left;">Product</th>
                                    <th style="text-align: center;">Aant.</th>
                                    <th style="text-align: right;">Subtotaal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                        <div class="total-row">
                            Totaal: €${orderTotal.toFixed(2)}
                        </div>
                    </div>

                    <div class="section">
                        <h2>🔍 Referentie</h2>
                        <div class="reference-box">
                            Session ID: ${sessionId}
                        </div>
                    </div>

                    <div class="action-text">
                        <strong>📋 Volgende Stap:</strong><br>
                        Bereid de producten voor en zet deze klaar voor afhaling in de winkel.
                    </div>
                </div>

                <div class="footer">
                    <p>Dit is een automatisch bericht van het shop beheersysteem.</p>
                    <p>© ${new Date().getFullYear()} Zizis Shop</p>
                </div>
            </div>
        </body>
        </html>
    `;
};